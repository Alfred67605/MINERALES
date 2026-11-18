import { FastifyRequest, FastifyReply } from 'fastify';
import { RolUsuario } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  nombre: string;
  email: string;
  username: string;
  rol: RolUsuario;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUserPayload;
    user: AuthUserPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Soportar tanto Bearer token como cookie de sesión httpOnly
    const cookieToken = request.cookies?.mineralflow_token;
    if (!request.headers.authorization && cookieToken) {
      request.headers.authorization = `Bearer ${cookieToken}`;
    }
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({
      error: 'No autenticado',
      mensaje: 'Su sesión ha expirado o no ha iniciado sesión. Por favor ingrese sus credenciales.',
    });
  }
}

export function authorizeRoles(...rolesPermitidos: RolUsuario[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;

    const user = request.user;
    if (!user || !rolesPermitidos.includes(user.rol)) {
      return reply.status(403).send({
        error: 'Acceso denegado',
        mensaje: `Su rol actual (${user?.rol || 'SIN_ROL'}) no tiene permisos para realizar esta operación. Se requiere: ${rolesPermitidos.join(' o ')}.`,
      });
    }
  };
}

