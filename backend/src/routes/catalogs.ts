import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma, registrarAuditoria } from '../db.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const proveedorSchema = z.object({
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  nombre: z.string().min(2, 'Ingrese el nombre o razón social del proveedor'),
  minaOrigen: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional(),
});

const compradorSchema = z.object({
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  nombre: z.string().min(2, 'Ingrese el nombre o empresa compradora'),
  identificacion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  estado: z.enum(['ACTIVO', 'INACTIVO']).optional(),
});

const catalogoLeySchema = z.object({
  codigo: z.string().min(2),
  mineral: z.string().min(2),
  simbolo: z.string().min(1),
  nombreLey: z.string().min(2),
  unidadMedida: z.string().min(1),
  valorMinimo: z.number().min(0),
  valorMaximo: z.number().positive(),
  decimales: z.number().int().min(0).max(4).default(2),
});

export async function catalogRoutes(app: FastifyInstance) {
  // ================= PROVEEDORES =================
  app.get('/api/proveedores', { preHandler: [authenticate] }, async (request, reply) => {
    const { q, estado } = request.query as { q?: string; estado?: string };
    const where: any = {};

    if (estado === 'ACTIVO' || estado === 'INACTIVO') {
      where.estado = estado;
    }

    if (q && q.trim()) {
      where.OR = [
        { codigo: { contains: q.trim(), mode: 'insensitive' } },
        { nombre: { contains: q.trim(), mode: 'insensitive' } },
        { minaOrigen: { contains: q.trim(), mode: 'insensitive' } },
      ];
    }

    const proveedores = await prisma.proveedor.findMany({
      where,
      include: {
        _count: {
          select: { lotes: true, compras: true },
        },
      },
      orderBy: { codigo: 'asc' },
    });

    return reply.send({ proveedores });
  });

  app.get('/api/proveedores/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const proveedor = await prisma.proveedor.findUnique({
      where: { id },
      include: {
        lotes: {
          include: {
            leyes: { include: { catalogoLey: true } },
          },
          orderBy: { fechaCompra: 'desc' },
        },
        compras: {
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!proveedor) {
      return reply.status(404).send({ error: 'No encontrado', mensaje: 'El proveedor solicitado no existe.' });
    }

    return reply.send({ proveedor });
  });

  app.post(
    '/api/proveedores',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'ALMACENERO')] },
    async (request, reply) => {
      const parsed = proveedorSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parsed.error.issues[0]?.message,
        });
      }

      const data = parsed.data;
      const dup = await prisma.proveedor.findUnique({ where: { codigo: data.codigo.trim().toUpperCase() } });
      if (dup) {
        return reply.status(409).send({
          error: 'Código duplicado',
          mensaje: `Ya existe un proveedor registrado con el código ${data.codigo}.`,
        });
      }

      const nuevo = await prisma.proveedor.create({
        data: {
          codigo: data.codigo.trim().toUpperCase(),
          nombre: data.nombre.trim(),
          minaOrigen: data.minaOrigen?.trim() || null,
          telefono: data.telefono?.trim() || null,
          observaciones: data.observaciones?.trim() || null,
          estado: data.estado || 'ACTIVO',
        },
      });

      await registrarAuditoria({
        usuarioId: request.user.id,
        usuarioNombre: request.user.nombre,
        accion: 'CREAR_PROVEEDOR',
        entidad: 'Proveedor',
        registroId: nuevo.id,
        valorNuevo: nuevo,
      });

      return reply.status(201).send({ proveedor: nuevo });
    }
  );

  app.put(
    '/api/proveedores/:id',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'ALMACENERO')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = proveedorSchema.partial().safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parsed.error.issues[0]?.message,
        });
      }

      const existente = await prisma.proveedor.findUnique({ where: { id } });
      if (!existente) {
        return reply.status(404).send({ error: 'No encontrado', mensaje: 'Proveedor no encontrado.' });
      }

      const actualizado = await prisma.proveedor.update({
        where: { id },
        data: {
          codigo: parsed.data.codigo ? parsed.data.codigo.trim().toUpperCase() : undefined,
          nombre: parsed.data.nombre ? parsed.data.nombre.trim() : undefined,
          minaOrigen: parsed.data.minaOrigen !== undefined ? parsed.data.minaOrigen?.trim() || null : undefined,
          telefono: parsed.data.telefono !== undefined ? parsed.data.telefono?.trim() || null : undefined,
          observaciones: parsed.data.observaciones !== undefined ? parsed.data.observaciones?.trim() || null : undefined,
          estado: parsed.data.estado,
        },
      });

      await registrarAuditoria({
        usuarioId: request.user.id,
        usuarioNombre: request.user.nombre,
        accion: 'ACTUALIZAR_PROVEEDOR',
        entidad: 'Proveedor',
        registroId: id,
        valorAnterior: existente,
        valorNuevo: actualizado,
      });

      return reply.send({ proveedor: actualizado });
    }
  );

  // ================= COMPRADORES =================
  app.get('/api/compradores', { preHandler: [authenticate] }, async (request, reply) => {
    const { q, estado } = request.query as { q?: string; estado?: string };
    const where: any = {};

    if (estado === 'ACTIVO' || estado === 'INACTIVO') {
      where.estado = estado;
    }

    if (q && q.trim()) {
      where.OR = [
        { codigo: { contains: q.trim(), mode: 'insensitive' } },
        { nombre: { contains: q.trim(), mode: 'insensitive' } },
        { identificacion: { contains: q.trim(), mode: 'insensitive' } },
      ];
    }

    const compradores = await prisma.comprador.findMany({
      where,
      include: {
        _count: {
          select: { ventas: true },
        },
      },
      orderBy: { codigo: 'asc' },
    });

    return reply.send({ compradores });
  });

  app.get('/api/compradores/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const comprador = await prisma.comprador.findUnique({
      where: { id },
      include: {
        ventas: {
          include: {
            resumenLeyes: true,
            usuario: { select: { nombre: true } },
          },
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!comprador) {
      return reply.status(404).send({ error: 'No encontrado', mensaje: 'Comprador no encontrado.' });
    }

    return reply.send({ comprador });
  });

  app.post(
    '/api/compradores',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'VENDEDOR')] },
    async (request, reply) => {
      const parsed = compradorSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parsed.error.issues[0]?.message,
        });
      }

      const data = parsed.data;
      const dup = await prisma.comprador.findUnique({ where: { codigo: data.codigo.trim().toUpperCase() } });
      if (dup) {
        return reply.status(409).send({
          error: 'Código duplicado',
          mensaje: `Ya existe un comprador registrado con el código ${data.codigo}.`,
        });
      }

      const nuevo = await prisma.comprador.create({
        data: {
          codigo: data.codigo.trim().toUpperCase(),
          nombre: data.nombre.trim(),
          identificacion: data.identificacion?.trim() || null,
          telefono: data.telefono?.trim() || null,
          direccion: data.direccion?.trim() || null,
          observaciones: data.observaciones?.trim() || null,
          estado: data.estado || 'ACTIVO',
        },
      });

      await registrarAuditoria({
        usuarioId: request.user.id,
        usuarioNombre: request.user.nombre,
        accion: 'CREAR_COMPRADOR',
        entidad: 'Comprador',
        registroId: nuevo.id,
        valorNuevo: nuevo,
      });

      return reply.status(201).send({ comprador: nuevo });
    }
  );

  app.put(
    '/api/compradores/:id',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'VENDEDOR')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = compradorSchema.partial().safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parsed.error.issues[0]?.message,
        });
      }

      const existente = await prisma.comprador.findUnique({ where: { id } });
      if (!existente) {
        return reply.status(404).send({ error: 'No encontrado', mensaje: 'Comprador no encontrado.' });
      }

      const actualizado = await prisma.comprador.update({
        where: { id },
        data: {
          codigo: parsed.data.codigo ? parsed.data.codigo.trim().toUpperCase() : undefined,
          nombre: parsed.data.nombre ? parsed.data.nombre.trim() : undefined,
          identificacion: parsed.data.identificacion !== undefined ? parsed.data.identificacion?.trim() || null : undefined,
          telefono: parsed.data.telefono !== undefined ? parsed.data.telefono?.trim() || null : undefined,
          direccion: parsed.data.direccion !== undefined ? parsed.data.direccion?.trim() || null : undefined,
          observaciones: parsed.data.observaciones !== undefined ? parsed.data.observaciones?.trim() || null : undefined,
          estado: parsed.data.estado,
        },
      });

      await registrarAuditoria({
        usuarioId: request.user.id,
        usuarioNombre: request.user.nombre,
        accion: 'ACTUALIZAR_COMPRADOR',
        entidad: 'Comprador',
        registroId: id,
        valorAnterior: existente,
        valorNuevo: actualizado,
      });

      return reply.send({ comprador: actualizado });
    }
  );

  // ================= CATÁLOGO DE LEYES MINERALES =================
  app.get('/api/catalogo-leyes', { preHandler: [authenticate] }, async (_request, reply) => {
    const catalogoLeyes = await prisma.catalogoLey.findMany({
      where: { estado: 'ACTIVO' },
      orderBy: { codigo: 'asc' },
    });
    return reply.send({ catalogoLeyes });
  });

  app.post(
    '/api/catalogo-leyes',
    { preHandler: [authorizeRoles('ADMINISTRADOR')] },
    async (request, reply) => {
      const parsed = catalogoLeySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parsed.error.issues[0]?.message,
        });
      }

      const d = parsed.data;
      const nuevaLey = await prisma.catalogoLey.create({
        data: {
          codigo: d.codigo.trim().toUpperCase(),
          mineral: d.mineral.trim(),
          simbolo: d.simbolo.trim(),
          nombreLey: d.nombreLey.trim(),
          unidadMedida: d.unidadMedida.trim(),
          valorMinimo: d.valorMinimo,
          valorMaximo: d.valorMaximo,
          decimales: d.decimales,
          estado: 'ACTIVO',
        },
      });

      await registrarAuditoria({
        usuarioId: request.user.id,
        usuarioNombre: request.user.nombre,
        accion: 'CREAR_CATALOGO_LEY',
        entidad: 'CatalogoLey',
        registroId: nuevaLey.id,
        valorNuevo: nuevaLey,
      });

      return reply.status(201).send({ catalogoLey: nuevaLey });
    }
  );
}

