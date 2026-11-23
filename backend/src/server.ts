import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { authRoutes } from './routes/auth.js';
import { catalogRoutes } from './routes/catalogs.js';
import { comprasLotesRoutes } from './routes/comprasLotes.js';
import { ventasRoutes } from './routes/ventas.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { operacionesV2Routes } from './routes/operacionesV2.js';
import { cotizacionesRoutes } from './routes/cotizaciones.js';
import { respaldosRoutes } from './routes/respaldos.js';

dotenv.config();

// Auto-sanitización de DATABASE_URL si contiene caracteres especiales no codificados (como '#' en contraseñas)
if (process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.includes('#@')) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/#@/g, '%23@');
  }
  if (!process.env.DATABASE_URL.includes('schema=')) {
    process.env.DATABASE_URL += (process.env.DATABASE_URL.includes('?') ? '&' : '?') + 'schema=public';
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(cookie);

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'mineralflow-super-secret-jwt-key-bolivia-2026',
  });

  app.get('/api/health', async () => {
    return { status: 'ok', service: 'KOYOSIAT S.R.L. API', timestamp: new Date().toISOString() };
  });

  await app.register(authRoutes);
  await app.register(catalogRoutes);
  await app.register(comprasLotesRoutes);
  await app.register(ventasRoutes);
  await app.register(dashboardRoutes);
  await app.register(operacionesV2Routes);
  await app.register(cotizacionesRoutes);
  await app.register(respaldosRoutes);

  // Servir frontend compilado en producción con fallback a index.html (SPA)
  const clientDist = process.env.CLIENT_DIST
    ? path.resolve(process.env.CLIENT_DIST)
    : path.resolve(process.cwd(), '../frontend/dist');

  if (fs.existsSync(clientDist)) {
    await app.register(fastifyStatic, {
      root: clientDist,
      prefix: '/',
    });

    app.setNotFoundHandler((req, reply) => {
      if (req.raw.url && req.raw.url.startsWith('/api')) {
        reply.status(404).send({ error: 'Endpoint no encontrado', url: req.raw.url });
      } else {
        reply.sendFile('index.html');
      }
    });
  }

  return app;
}

const isMainModule =
  !process.env.VITEST &&
  (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js'));

if (isMainModule) {
  const start = async () => {
    const app = await buildApp();
    const port = Number(process.env.PORT) || 3001;
    try {
      await app.listen({ port, host: '0.0.0.0' });
      console.log(`🚀 KOYOSIAT S.R.L. API ejecutándose en http://localhost:${port}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}
