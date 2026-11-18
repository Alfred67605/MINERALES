import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { prisma, registrarAuditoria } from '../db.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { convertirPesoAKg } from '../utils/calculations.js';

const actualizarEnsayeSchema = z.object({
  valor: z.union([z.number(), z.string()]),
  tipoEnsaye: z.enum(['PROVISIONAL', 'FINAL', 'LABORATORIO_EXTERNO', 'DIRIMENCIA']),
  estadoMedicion: z.enum([
    'MEDIDO',
    'SIN_DATO',
    'NO_MEDIDO',
    'BAJO_LIMITE_DETECCION',
    'CERO_MEDIDO',
    'VALIDADO',
  ]),
  laboratorio: z.string().min(2),
  nroCertificado: z.string().min(2),
  motivoCambio: z.string().min(3, 'Indique el motivo de actualización o emisión de certificado'),
});

const crearMinaSchema = z.object({
  codigo: z.string().min(2),
  nombre: z.string().min(2),
  localidad: z.string().min(2),
  departamento: z.string().min(2),
  proveedorId: z.string().optional().nullable(),
});

const crearDocumentoSchema = z.object({
  tipoDocumento: z.string().min(2),
  numeroDocumento: z.string().min(2),
  estado: z.enum(['PENDIENTE', 'RECIBIDO', 'VERIFICADO']).default('RECIBIDO'),
  nombreArchivo: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  tamanoBytes: z.number().int().optional().nullable(),
  compraId: z.string().optional().nullable(),
  loteId: z.string().optional().nullable(),
  ventaId: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

export async function operacionesV2Routes(app: FastifyInstance) {
  // ================= 1. MINAS DE PROCEDENCIA =================
  app.get('/api/minas', { preHandler: [authenticate] }, async (_request, reply) => {
    const minas = await prisma.mina.findMany({
      include: {
        proveedor: { select: { id: true, codigo: true, nombre: true } },
        _count: { select: { lotes: true } },
      },
      orderBy: { codigo: 'asc' },
    });
    return reply.send({ minas });
  });

  app.post(
    '/api/minas',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'ALMACENERO')] },
    async (request, reply) => {
      const parsed = crearMinaSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parsed.error.issues[0]?.message,
        });
      }
      const d = parsed.data;
      const mina = await prisma.mina.create({
        data: {
          codigo: d.codigo.trim().toUpperCase(),
          nombre: d.nombre.trim(),
          localidad: d.localidad.trim(),
          departamento: d.departamento.trim(),
          proveedorId: d.proveedorId || null,
          estado: 'ACTIVO',
        },
      });
      await registrarAuditoria({
        usuarioId: request.user.id,
        usuarioNombre: request.user.nombre,
        accion: 'CREAR_MINA_PROCEDENCIA',
        entidad: 'Mina',
        registroId: mina.id,
        valorNuevo: mina,
      });
      return reply.status(201).send({ mina });
    }
  );

  // ================= 2. UBICACIONES Y KARDEX DE ALMACÉN =================
  app.get('/api/ubicaciones-almacen', { preHandler: [authenticate] }, async (_request, reply) => {
    const ubicaciones = await prisma.ubicacionAlmacen.findMany({
      include: {
        lotes: {
          where: { estado: 'DISPONIBLE' },
          select: {
            id: true,
            numeroLote: true,
            cantidadSacos: true,
            pesoNeto: true,
            unidadPeso: true,
            tipoMineral: true,
          },
        },
      },
      orderBy: { codigo: 'asc' },
    });

    return reply.send({
      ubicaciones: ubicaciones.map((u) => {
        const pesoOcupadoKg = u.lotes.reduce(
          (acc, l) => acc.add(convertirPesoAKg(l.pesoNeto.toString(), l.unidadPeso)),
          new Decimal(0)
        );
        return {
          id: u.id,
          codigo: u.codigo,
          nombre: u.nombre,
          zona: u.zona,
          capacidadKg: Number(u.capacidadKg),
          pesoOcupadoKg: Number(pesoOcupadoKg.toFixed(2)),
          lotesDisponiblesCount: u.lotes.length,
          esConceptual: u.esConceptual,
          estado: u.estado,
        };
      }),
    });
  });

  app.get('/api/kardex', { preHandler: [authenticate] }, async (request, reply) => {
    const { loteId, tipoMovimiento, limit = '150' } = request.query as {
      loteId?: string;
      tipoMovimiento?: string;
      limit?: string;
    };
    const where: any = {};
    if (loteId) where.loteId = loteId;
    if (tipoMovimiento) where.tipoMovimiento = tipoMovimiento;

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        lote: {
          select: {
            id: true,
            numeroLote: true,
            tipoMineral: true,
            estado: true,
            proveedor: { select: { nombre: true } },
          },
        },
      },
      orderBy: { fechaHora: 'desc' },
      take: Math.min(parseInt(limit, 10) || 150, 500),
    });

    return reply.send({
      movimientos: movimientos.map((m) => ({
        id: m.id,
        loteId: m.loteId,
        numeroLote: m.lote.numeroLote,
        tipoMineral: m.lote.tipoMineral,
        proveedorNombre: m.lote.proveedor.nombre,
        estadoLote: m.lote.estado,
        tipoMovimiento: m.tipoMovimiento,
        ubicacionOrigen: m.ubicacionOrigen,
        ubicacionDestino: m.ubicacionDestino,
        sacosAntes: m.sacosAntes,
        sacosDespues: m.sacosDespues,
        pesoKgAntes: Number(new Decimal(m.pesoKgAntes.toString()).toFixed(2)),
        pesoKgDespues: Number(new Decimal(m.pesoKgDespues.toString()).toFixed(2)),
        motivo: m.motivo,
        usuarioNombre: m.usuarioNombre,
        fechaHora: m.fechaHora,
      })),
    });
  });

  // Cambio de ubicación o ajuste controlado en Almacén
  app.post(
    '/api/lotes/:id/movimiento',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'ALMACENERO')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as { ubicacionId: string; motivo?: string };

      const lote = await prisma.lote.findUnique({
        where: { id },
        include: { ubicacion: true },
      });
      if (!lote) {
        return reply.status(404).send({ error: 'No encontrado', mensaje: 'Lote no encontrado.' });
      }
      if (lote.estado === 'VENDIDO') {
        return reply.status(409).send({
          error: 'Lote vendido',
          mensaje: 'No se puede reubicar un lote que ya fue vendido y despachado.',
        });
      }

      const nuevaUbicacion = await prisma.ubicacionAlmacen.findUnique({
        where: { id: body.ubicacionId },
      });
      if (!nuevaUbicacion) {
        return reply.status(400).send({ error: 'Ubicación inválida', mensaje: 'La zona seleccionada no existe.' });
      }

      const pesoKg = convertirPesoAKg(lote.pesoNeto.toString(), lote.unidadPeso);

      await prisma.$transaction(async (tx) => {
        await tx.lote.update({
          where: { id },
          data: { ubicacionId: nuevaUbicacion.id },
        });
        await tx.movimientoInventario.create({
          data: {
            loteId: id,
            tipoMovimiento: 'CAMBIO_UBICACION',
            ubicacionOrigen: lote.ubicacion?.codigo || 'SIN-ZONA',
            ubicacionDestino: nuevaUbicacion.codigo,
            sacosAntes: lote.cantidadSacos,
            sacosDespues: lote.cantidadSacos,
            pesoKgAntes: pesoKg.toFixed(4),
            pesoKgDespues: pesoKg.toFixed(4),
            motivo: body.motivo || `Traslado interno a ${nuevaUbicacion.nombre}`,
            usuarioNombre: request.user.nombre,
          },
        });
      });

      return reply.send({
        mensaje: `Lote ${lote.numeroLote} trasladado a ${nuevaUbicacion.codigo} (${nuevaUbicacion.nombre}).`,
      });
    }
  );

  // ================= 3. LABORATORIO Y VERSIONADO DE ENSAYES =================
  app.get('/api/laboratorio/ensayes', { preHandler: [authenticate] }, async (request, reply) => {
    const { q, tipoEnsaye, estadoLote } = request.query as {
      q?: string;
      tipoEnsaye?: string;
      estadoLote?: string;
    };

    const where: any = {};
    if (tipoEnsaye) where.tipoEnsaye = tipoEnsaye;
    if (estadoLote === 'DISPONIBLE' || estadoLote === 'VENDIDO') {
      where.lote = { estado: estadoLote };
    }
    if (q && q.trim()) {
      where.OR = [
        { nroCertificado: { contains: q.trim(), mode: 'insensitive' } },
        { laboratorio: { contains: q.trim(), mode: 'insensitive' } },
        { lote: { numeroLote: { contains: q.trim(), mode: 'insensitive' } } },
      ];
    }

    const ensayes = await prisma.loteLey.findMany({
      where,
      include: {
        catalogoLey: true,
        lote: {
          select: {
            id: true,
            numeroLote: true,
            estado: true,
            tipoMineral: true,
            pesoNeto: true,
            unidadPeso: true,
            humedadPct: true,
            proveedor: { select: { nombre: true } },
          },
        },
        versiones: { orderBy: { version: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return reply.send({
      ensayes: ensayes.map((e) => ({
        id: e.id,
        loteId: e.loteId,
        numeroLote: e.lote.numeroLote,
        estadoLote: e.lote.estado,
        tipoMineral: e.lote.tipoMineral,
        proveedorNombre: e.lote.proveedor.nombre,
        pesoNeto: Number(new Decimal(e.lote.pesoNeto.toString()).toFixed(2)),
        unidadPeso: e.lote.unidadPeso,
        humedadPct: Number(new Decimal(e.lote.humedadPct?.toString() || '0').toFixed(2)),
        codigoLey: e.catalogoLey.codigo,
        mineral: e.catalogoLey.mineral,
        simbolo: e.catalogoLey.simbolo,
        nombreLey: e.catalogoLey.nombreLey,
        unidadMedida: e.catalogoLey.unidadMedida,
        valor: Number(new Decimal(e.valor.toString()).toFixed(4)),
        valorStr: new Decimal(e.valor.toString()).toFixed(e.catalogoLey.decimales ?? 2),
        tipoEnsaye: e.tipoEnsaye,
        estadoMedicion: e.estadoMedicion,
        laboratorio: e.laboratorio,
        nroCertificado: e.nroCertificado,
        metodoAnalisis: e.metodoAnalisis,
        versionActual: e.versionActual,
        validadoPor: e.validadoPor,
        fechaEnsaye: e.fechaEnsaye,
        versiones: e.versiones.map((v) => ({
          id: v.id,
          version: v.version,
          valor: Number(new Decimal(v.valor.toString()).toFixed(4)),
          valorStr: new Decimal(v.valor.toString()).toFixed(e.catalogoLey.decimales ?? 2),
          tipoEnsaye: v.tipoEnsaye,
          estadoMedicion: v.estadoMedicion,
          laboratorio: v.laboratorio,
          nroCertificado: v.nroCertificado,
          motivoCambio: v.motivoCambio,
          usuarioNombre: v.usuarioNombre,
          createdAt: v.createdAt,
        })),
      })),
    });
  });

  // Emitir nueva versión de ensaye químico (Bloqueado si el lote ya fue VENDIDO para proteger ventas cerradas)
  app.put(
    '/api/laboratorio/ensayes/:id',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'LABORATORIO', 'ALMACENERO')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = actualizarEnsayeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parsed.error.issues[0]?.message,
        });
      }

      const ensayeActual = await prisma.loteLey.findUnique({
        where: { id },
        include: { lote: true, catalogoLey: true },
      });

      if (!ensayeActual) {
        return reply.status(404).send({ error: 'No encontrado', mensaje: 'Ensaye no encontrado.' });
      }

      if (ensayeActual.lote.estado === 'VENDIDO') {
        return reply.status(409).send({
          error: 'Ensaye bloqueado por venta cerrada',
          mensaje: `El lote ${ensayeActual.lote.numeroLote} ya fue VENDIDO. No se permite reemplazar ni alterar retroactivamente los análisis de lotes liquidados.`,
        });
      }

      const data = parsed.data;
      const valDec = data.estadoMedicion === 'CERO_MEDIDO' ? new Decimal(0) : new Decimal(data.valor);
      if (
        valDec.lt(ensayeActual.catalogoLey.valorMinimo) ||
        valDec.gt(ensayeActual.catalogoLey.valorMaximo)
      ) {
        return reply.status(400).send({
          error: 'Valor fuera de límite',
          mensaje: `El valor ${valDec.toString()} excede los límites de ${ensayeActual.catalogoLey.nombreLey}.`,
        });
      }

      const nuevaVersionNum = (ensayeActual.versionActual || 1) + 1;

      const actualizado = await prisma.$transaction(async (tx) => {
        const up = await tx.loteLey.update({
          where: { id },
          data: {
            valor: valDec.toFixed(4),
            tipoEnsaye: data.tipoEnsaye,
            estadoMedicion: data.estadoMedicion,
            laboratorio: data.laboratorio.trim(),
            nroCertificado: data.nroCertificado.trim().toUpperCase(),
            versionActual: nuevaVersionNum,
            validadoPor: request.user.nombre,
            fechaEnsaye: new Date(),
          },
          include: {
            catalogoLey: true,
            versiones: { orderBy: { version: 'desc' } },
          },
        });

        await tx.ensayeVersion.create({
          data: {
            loteLeyId: id,
            version: nuevaVersionNum,
            valor: valDec.toFixed(4),
            tipoEnsaye: data.tipoEnsaye,
            estadoMedicion: data.estadoMedicion,
            laboratorio: data.laboratorio.trim(),
            nroCertificado: data.nroCertificado.trim().toUpperCase(),
            motivoCambio: data.motivoCambio.trim(),
            usuarioNombre: request.user.nombre,
          },
        });

        await registrarAuditoria({
          tx,
          usuarioId: request.user.id,
          usuarioNombre: request.user.nombre,
          accion: 'VERSIONAR_ENSAYE_LABORATORIO',
          entidad: 'LoteLey',
          registroId: id,
          valorAnterior: {
            lote: ensayeActual.lote.numeroLote,
            ley: ensayeActual.catalogoLey.codigo,
            version: ensayeActual.versionActual,
            valor: ensayeActual.valor.toString(),
          },
          valorNuevo: {
            lote: ensayeActual.lote.numeroLote,
            ley: ensayeActual.catalogoLey.codigo,
            version: nuevaVersionNum,
            valor: valDec.toFixed(4),
            nroCertificado: data.nroCertificado,
            motivo: data.motivoCambio,
          },
        });

        return up;
      });

      return reply.send({
        mensaje: `Ensaye ${actualizado.catalogoLey.nombreLey} del lote ${ensayeActual.lote.numeroLote} actualizado a versión v${nuevaVersionNum}.`,
        ensaye: actualizado,
      });
    }
  );

  // ================= 4. DOCUMENTACIÓN NORMATIVA BOLIVIA (M-02 / NIM / NIAR / M-03) Y TRAZABILIDAD =================
  app.get('/api/cumplimiento', { preHandler: [authenticate] }, async (_request, reply) => {
    const [documentos, compras, ventas] = await Promise.all([
      prisma.documentoCumplimiento.findMany({
        include: {
          compra: { select: { id: true, numeroCompra: true, proveedor: { select: { nombre: true } } } },
          lote: { select: { id: true, numeroLote: true } },
          venta: { select: { id: true, numeroVenta: true, compradorNombreSnapshot: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.compra.findMany({
        include: {
          proveedor: true,
          lotes: { select: { id: true, numeroLote: true, estado: true, cantidadSacos: true, pesoNeto: true } },
        },
        orderBy: { fecha: 'desc' },
      }),
      prisma.venta.findMany({
        include: {
          comprador: true,
          detalles: true,
          resumenLeyes: true,
        },
        orderBy: { fecha: 'desc' },
      }),
    ]);

    return reply.send({
      avisoLegal:
        'Asistencia documental interna referenciada en normativa SENARECOM (Formulario M-02, NIM/NIAR y M-03). Este módulo organiza respaldos internos y no sustituye la declaración oficial ante SINACOM.',
      documentos,
      comprasNormativas: compras.map((c) => ({
        id: c.id,
        numeroCompra: c.numeroCompra,
        fecha: c.fecha,
        proveedorNombre: c.proveedor.nombre,
        nimNiar: c.nimOperador || c.proveedor.nimNiar || 'PENDIENTE',
        boletoPesaje: c.boletoPesaje || '-',
        expedienteM02: c.expedienteM02 || 'PENDIENTE',
        estadoM02: c.estadoM02,
        totalLotes: c.lotes.length,
        lotes: c.lotes,
      })),
      ventasNormativas: ventas.map((v) => ({
        id: v.id,
        numeroVenta: v.numeroVenta,
        fecha: v.fecha,
        compradorNombre: v.compradorNombreSnapshot,
        compradorNit: v.compradorNitSnapshot,
        expedienteM02: v.expedienteM02 || 'PENDIENTE',
        estadoM02: v.estadoM02,
        expedienteM03: v.expedienteM03 || 'N/A (Mercado Interno)',
        totalLotes: v.totalLotes,
        pesoTotalKg: Number(v.pesoTotalKg),
      })),
    });
  });

  app.post(
    '/api/cumplimiento/documentos',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'ALMACENERO', 'VENDEDOR', 'LABORATORIO')] },
    async (request, reply) => {
      const parsed = crearDocumentoSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validación fallida',
          mensaje: parsed.error.issues[0]?.message,
        });
      }

      const d = parsed.data;
      const doc = await prisma.documentoCumplimiento.create({
        data: {
          tipoDocumento: d.tipoDocumento,
          numeroDocumento: d.numeroDocumento.trim().toUpperCase(),
          estado: d.estado,
          nombreArchivo: d.nombreArchivo || `${d.numeroDocumento.trim()}.pdf`,
          mimeType: d.mimeType || 'application/pdf',
          tamanoBytes: d.tamanoBytes || 128000,
          compraId: d.compraId || null,
          loteId: d.loteId || null,
          ventaId: d.ventaId || null,
          observaciones: d.observaciones || null,
          usuarioNombre: request.user.nombre,
        },
      });

      await registrarAuditoria({
        usuarioId: request.user.id,
        usuarioNombre: request.user.nombre,
        accion: 'ADJUNTAR_DOCUMENTO_NORMATIVO',
        entidad: 'DocumentoCumplimiento',
        registroId: doc.id,
        valorNuevo: doc,
      });

      return reply.status(201).send({ documento: doc });
    }
  );
}

