import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth.js';
import { catalogRoutes } from './routes/catalogs.js';
import { comprasLotesRoutes } from './routes/comprasLotes.js';
import { ventasRoutes } from './routes/ventas.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { operacionesV2Routes } from './routes/operacionesV2.js';
import { cotizacionesRoutes } from './routes/cotizaciones.js';

dotenv.config();

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
    return { status: 'ok', service: 'MineralFlow API', timestamp: new Date().toISOString() };
  });

  await app.register(authRoutes);
  await app.register(catalogRoutes);
  await app.register(comprasLotesRoutes);
  await app.register(ventasRoutes);
  await app.register(dashboardRoutes);
  await app.register(operacionesV2Routes);
  await app.register(cotizacionesRoutes);

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
      console.log(`🚀 MineralFlow API ejecutándose en http://localhost:${port}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}
