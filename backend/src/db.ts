import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export async function registrarAuditoria(params: {
  tx?: any;
  usuarioId?: string | null;
  usuarioNombre: string;
  accion: string;
  entidad: string;
  registroId: string;
  valorAnterior?: unknown;
  valorNuevo?: unknown;
}) {
  const client = params.tx || prisma;
  await client.auditoria.create({
    data: {
      usuarioId: params.usuarioId || null,
      usuarioNombre: params.usuarioNombre,
      accion: params.accion,
      entidad: params.entidad,
      registroId: params.registroId,
      valorAnterior: params.valorAnterior ? JSON.parse(JSON.stringify(params.valorAnterior)) : null,
      valorNuevo: params.valorNuevo ? JSON.parse(JSON.stringify(params.valorNuevo)) : null,
    },
  });
}

