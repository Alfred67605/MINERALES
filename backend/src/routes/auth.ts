import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma, registrarAuditoria } from '../db.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';

const loginSchema = z.object({
  identificador: z.string().min(2, 'Ingrese su usuario o correo electrónico'),
  password: z.string().min(3, 'Ingrese su contraseña'),
});

const createUserSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  username: z.string().min(3, 'Nombre de usuario mínimo 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['ADMINISTRADOR', 'ALMACENERO', 'VENDEDOR', 'LABORATORIO', 'CONSULTA']),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        mensaje: parsed.error.issues[0]?.message || 'Verifique sus credenciales',
      });
    }

    const { identificador, password } = parsed.data;
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: { equals: identificador, mode: 'insensitive' } },
          { email: { equals: identificador, mode: 'insensitive' } },
        ],
      },
    });

    if (!usuario || usuario.estado !== 'ACTIVO') {
      return reply.status(401).send({
        error: 'Credenciales inválidas',
        mensaje: 'Usuario no encontrado o cuenta desactivada.',
      });
    }

    const passwordValida = await bcrypt.compare(password, usuario.hashPassword);
    if (!passwordValida) {
      return reply.status(401).send({
        error: 'Credenciales inválidas',
        mensaje: 'La contraseña ingresada es incorrecta.',
      });
    }

    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      username: usuario.username,
      rol: usuario.rol,
    };

    const token = app.jwt.sign(payload, { expiresIn: '12h' });

    reply.setCookie('mineralflow_token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 12,
    });

    await registrarAuditoria({
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      accion: 'LOGIN_EXITOSO',
      entidad: 'Usuario',
      registroId: usuario.id,
      valorNuevo: { username: usuario.username, rol: usuario.rol },
    });

    return reply.send({
      token,
      usuario: payload,
    });
  });

  app.post('/api/auth/logout', async (request, reply) => {
    reply.clearCookie('mineralflow_token', { path: '/' });
    return reply.send({ mensaje: 'Sesión cerrada correctamente' });
  });

  app.get('/api/auth/me', { preHandler: [authenticate] }, async (request, reply) => {
    const usuario = await prisma.usuario.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        username: true,
        rol: true,
        estado: true,
      },
    });

    if (!usuario || usuario.estado !== 'ACTIVO') {
      return reply.status(401).send({ error: 'Sesión inválida', mensaje: 'El usuario ya no está activo.' });
    }

    return reply.send({ usuario });
  });

  // Administración de usuarios (Solo ADMINISTRADOR)
  app.get(
    '/api/usuarios',
    { preHandler: [authorizeRoles('ADMINISTRADOR')] },
    async (_request, reply) => {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          nombre: true,
          email: true,
          username: true,
          rol: true,
          estado: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });
      return reply.send({ usuarios });
    }
  );

  app.post(
    '/api/usuarios',
    { preHandler: [authorizeRoles('ADMINISTRADOR')] },
    async (request, reply) => {
      const parsed = createUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validación fallida',
          mensaje: parsed.error.issues[0]?.message,
        });
      }

      const { nombre, email, username, password, rol } = parsed.data;
      const existente = await prisma.usuario.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existente) {
        return reply.status(409).send({
          error: 'Usuario duplicado',
          mensaje: 'Ya existe un usuario con ese correo electrónico o nombre de usuario.',
        });
      }

      const hashPassword = await bcrypt.hash(password, 10);
      const nuevo = await prisma.usuario.create({
        data: {
          nombre,
          email,
          username,
          hashPassword,
          rol,
          estado: 'ACTIVO',
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          username: true,
          rol: true,
          estado: true,
          createdAt: true,
        },
      });

      await registrarAuditoria({
        usuarioId: request.user.id,
        usuarioNombre: request.user.nombre,
        accion: 'CREAR_USUARIO',
        entidad: 'Usuario',
        registroId: nuevo.id,
        valorNuevo: nuevo,
      });

      return reply.status(201).send({ usuario: nuevo });
    }
  );
}

