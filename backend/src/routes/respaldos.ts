import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../db.js';
import { authorizeRoles } from '../middleware/auth.js';

// Orden respetando llaves foráneas (padres primero)
const TABLAS = [
  'usuario',
  'proveedor',
  'mina',
  'comprador',
  'catalogoLey',
  'ubicacionAlmacen',
  'compra',
  'lote',
  'loteLey',
  'ensayeVersion',
  'movimientoInventario',
  'venta',
  'detalleVenta',
  'resumenLeyVenta',
  'documentoCumplimiento',
  'auditoria',
] as const;

const CARPETA = path.resolve(process.cwd(), '..', 'backups', 'respaldos');
const NOMBRE_VALIDO = /^respaldo_[0-9T\-]+\.json$/;

function asegurarCarpeta() {
  fs.mkdirSync(CARPETA, { recursive: true });
}

function rutaSegura(nombre: string): string | null {
  if (!NOMBRE_VALIDO.test(nombre)) return null;
  return path.join(CARPETA, nombre);
}

function replacer(_k: string, v: unknown) {
  return typeof v === 'bigint' ? v.toString() : v;
}

export async function crearRespaldo(usuario: string) {
  asegurarCarpeta();
  const datos: Record<string, unknown[]> = {};
  const resumen: Record<string, number> = {};
  for (const t of TABLAS) {
    const filas = await (prisma as any)[t].findMany();
    datos[t] = filas;
    resumen[t] = filas.length;
  }
  const ahora = new Date();
  const nombre = `respaldo_${ahora.toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
  const contenido = JSON.stringify(
    { app: 'MineralFlow', version: 1, creadoEn: ahora.toISOString(), creadoPor: usuario, resumen, datos },
    replacer
  );
  fs.writeFileSync(path.join(CARPETA, nombre), contenido, 'utf8');
  return { nombre, tamano: Buffer.byteLength(contenido), creadoEn: ahora.toISOString(), resumen };
}

function fechasAISO(obj: any) {
  return obj;
}

export async function restaurarDesdeArchivo(archivo: string) {
  const crudo = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  if (crudo?.app !== 'MineralFlow' || !crudo.datos) throw new Error('El archivo no es un respaldo válido de MineralFlow.');
  await prisma.$transaction(
    async (tx) => {
      for (const t of [...TABLAS].reverse()) await (tx as any)[t].deleteMany();
      for (const t of TABLAS) {
        let filas: any[] = crudo.datos[t] || [];
        if (t === 'auditoria') {
          filas = filas.map((f) => ({
            ...f,
            valorAnterior: f.valorAnterior ?? Prisma.DbNull,
            valorNuevo: f.valorNuevo ?? Prisma.DbNull,
          }));
        }
        if (filas.length) await (tx as any)[t].createMany({ data: fechasAISO(filas) });
      }
    },
    { timeout: 120000, maxWait: 20000 }
  );
  return crudo.resumen as Record<string, number>;
}

export async function respaldosRoutes(app: FastifyInstance) {
  const soloAdmin = { preHandler: authorizeRoles('ADMINISTRADOR') };
  const CONFIG_FILE = path.join(CARPETA, 'config_programacion.json');

  const leerConfig = () => {
    asegurarCarpeta();
    if (!fs.existsSync(CONFIG_FILE)) {
      return { activo: true, frecuencia: 'MENSUAL', hora: '23:30', actualizadoEn: new Date().toISOString() };
    }
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch {
      return { activo: true, frecuencia: 'MENSUAL', hora: '23:30', actualizadoEn: new Date().toISOString() };
    }
  };

  app.get('/api/respaldos/programacion', soloAdmin, async () => {
    return leerConfig();
  });

  app.put('/api/respaldos/programacion', soloAdmin, async (request) => {
    const body = (request.body as any) || {};
    const config = {
      activo: Boolean(body.activo),
      frecuencia: ['MENSUAL', 'QUINCENAL', 'SEMANAL', 'DIARIO'].includes(body.frecuencia)
        ? body.frecuencia
        : 'MENSUAL',
      hora: typeof body.hora === 'string' && /^\d{2}:\d{2}$/.test(body.hora) ? body.hora : '23:30',
      actualizadoEn: new Date().toISOString(),
    };
    asegurarCarpeta();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    await prisma.auditoria.create({
      data: {
        usuarioId: request.user.id,
        usuarioNombre: request.user.nombre,
        accion: 'CONFIGURAR_RESPALDO_AUTO',
        entidad: 'Respaldo',
        registroId: 'programacion',
        valorNuevo: config as any,
      },
    });
    return config;
  });

  app.get('/api/respaldos', soloAdmin, async () => {
    asegurarCarpeta();
    const archivos = fs
      .readdirSync(CARPETA)
      .filter((n) => NOMBRE_VALIDO.test(n))
      .map((nombre) => {
        const ruta = path.join(CARPETA, nombre);
        const st = fs.statSync(ruta);
        let resumen: Record<string, number> | undefined;
        try {
          const parsed = JSON.parse(fs.readFileSync(ruta, 'utf8'));
          resumen = parsed.resumen;
        } catch {}
        return { nombre, tamano: st.size, creadoEn: st.mtime.toISOString(), resumen };
      })
      .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    return { respaldos: archivos, carpeta: CARPETA };
  });

  app.post('/api/respaldos', soloAdmin, async (request) => {
    const r = await crearRespaldo(request.user.nombre);
    await prisma.auditoria.create({
      data: {
        usuarioId: request.user.id,
        usuarioNombre: request.user.nombre,
        accion: 'CREAR_RESPALDO',
        entidad: 'Respaldo',
        registroId: r.nombre,
        valorNuevo: r.resumen as any,
      },
    });
    return r;
  });

  app.post('/api/respaldos/importar', { ...soloAdmin, bodyLimit: 100 * 1024 * 1024 }, async (request, reply) => {
    const cuerpo: any = request.body;
    if (cuerpo?.app !== 'MineralFlow' || !cuerpo.datos) {
      return reply.status(400).send({ error: 'Archivo inválido', mensaje: 'El archivo no es un respaldo de MineralFlow.' });
    }
    asegurarCarpeta();
    const nombre = `respaldo_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    fs.writeFileSync(path.join(CARPETA, nombre), JSON.stringify(cuerpo), 'utf8');
    return { nombre };
  });

  app.get('/api/respaldos/:nombre/descargar', soloAdmin, async (request, reply) => {
    const ruta = rutaSegura((request.params as any).nombre);
    if (!ruta || !fs.existsSync(ruta)) return reply.status(404).send({ error: 'No encontrado', mensaje: 'No existe ese respaldo.' });
    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="${(request.params as any).nombre}"`);
    return reply.send(fs.createReadStream(ruta));
  });

  app.delete('/api/respaldos/:nombre', soloAdmin, async (request, reply) => {
    const ruta = rutaSegura((request.params as any).nombre);
    if (!ruta || !fs.existsSync(ruta)) return reply.status(404).send({ error: 'No encontrado', mensaje: 'No existe ese respaldo.' });
    fs.unlinkSync(ruta);
    return { ok: true };
  });

  app.post('/api/respaldos/:nombre/restaurar', soloAdmin, async (request, reply) => {
    const ruta = rutaSegura((request.params as any).nombre);
    if (!ruta || !fs.existsSync(ruta)) return reply.status(404).send({ error: 'No encontrado', mensaje: 'No existe ese respaldo.' });
    const confirmacion = (request.body as any)?.confirmacion;
    if (confirmacion !== 'RESTAURAR') {
      return reply.status(400).send({ error: 'Falta confirmación', mensaje: 'Escriba RESTAURAR para confirmar.' });
    }
    // Respaldo de seguridad automático antes de reemplazar los datos
    const previo = await crearRespaldo(request.user.nombre);
    try {
      const resumen = await restaurarDesdeArchivo(ruta);
      return { ok: true, resumen, respaldoPrevio: previo.nombre };
    } catch (e: any) {
      return reply.status(500).send({ error: 'Error al restaurar', mensaje: `No se pudo restaurar (no se cambió nada): ${e.message}` });
    }
  });
}
