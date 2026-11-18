import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';

export type ModoCotizacion = 'OFICIAL' | 'EN_VIVO' | 'MANUAL';

export interface CotizacionItem {
  id: string;
  mineral: string;
  subtipo?: string;
  simbolo: string;
  unidad: 'L.F.' | 'O.T.' | 'T.M.F.' | 'T.M.';
  unidadNombre: string;
  cotizacionUsd: number;
  cotizacionBob: number;
  variacionPct?: number;
  alicuotaRegalia: number; // Porcentaje de Regalía Minera según Ley 535
  quincena: string;
  fechaActualizacion: string;
  origen: ModoCotizacion;
  categoria: 'PRECIOSOS' | 'BASICOS' | 'ESTRATEGICOS' | 'NO_METALICOS';
}

// Datos oficiales exactos de la 2ª Quincena de Noviembre 2026 (Ministerio de Minería y Metalurgia / SENARECOM Bolivia)
const COTIZACIONES_OFICIALES_BASE: CotizacionItem[] = [
  {
    id: 'COT-ZN',
    mineral: 'ZINC',
    simbolo: 'Zn',
    unidad: 'L.F.',
    unidadNombre: 'Libra Fina',
    cotizacionUsd: 1.73,
    cotizacionBob: 12.04,
    variacionPct: 0.4,
    alicuotaRegalia: 5.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'BASICOS',
  },
  {
    id: 'COT-SN',
    mineral: 'ESTAÑO',
    simbolo: 'Sn',
    unidad: 'L.F.',
    unidadNombre: 'Libra Fina',
    cotizacionUsd: 21.53,
    cotizacionBob: 149.85,
    variacionPct: 1.2,
    alicuotaRegalia: 5.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'BASICOS',
  },
  {
    id: 'COT-AU-STD',
    mineral: 'ORO',
    subtipo: 'Minerales Tradicionales / Concentrados',
    simbolo: 'Au',
    unidad: 'O.T.',
    unidadNombre: 'Onza Troy',
    cotizacionUsd: 4010.22,
    cotizacionBob: 27911.13,
    variacionPct: 0.6,
    alicuotaRegalia: 7.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'PRECIOSOS',
  },
  {
    id: 'COT-AU-SULF',
    mineral: 'ORO',
    subtipo: 'DE MINERALES SULFUROSOS',
    simbolo: 'Au',
    unidad: 'O.T.',
    unidadNombre: 'Onza Troy',
    cotizacionUsd: 4010.22,
    cotizacionBob: 27911.13,
    variacionPct: 0.6,
    alicuotaRegalia: 5.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'PRECIOSOS',
  },
  {
    id: 'COT-AU-MARG',
    mineral: 'ORO',
    subtipo: 'DE YACIMIENTOS MARGINALES',
    simbolo: 'Au',
    unidad: 'O.T.',
    unidadNombre: 'Onza Troy',
    cotizacionUsd: 4010.22,
    cotizacionBob: 27911.13,
    variacionPct: 0.6,
    alicuotaRegalia: 3.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'PRECIOSOS',
  },
  {
    id: 'COT-AG',
    mineral: 'PLATA',
    simbolo: 'Ag',
    unidad: 'O.T.',
    unidadNombre: 'Onza Troy',
    cotizacionUsd: 51.46,
    cotizacionBob: 358.16,
    variacionPct: 1.8,
    alicuotaRegalia: 6.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'PRECIOSOS',
  },
  {
    id: 'COT-SB',
    mineral: 'ANTIMONIO',
    simbolo: 'Sb',
    unidad: 'T.M.F.',
    unidadNombre: 'Tonelada Métrica Fina',
    cotizacionUsd: 16475.0,
    cotizacionBob: 114666.0,
    variacionPct: -0.2,
    alicuotaRegalia: 5.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'ESTRATEGICOS',
  },
  {
    id: 'COT-PB',
    mineral: 'PLOMO',
    simbolo: 'Pb',
    unidad: 'L.F.',
    unidadNombre: 'Libra Fina',
    cotizacionUsd: 0.84,
    cotizacionBob: 5.85,
    variacionPct: -0.1,
    alicuotaRegalia: 5.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'BASICOS',
  },
  {
    id: 'COT-W',
    mineral: 'WOLFRAM',
    simbolo: 'W',
    unidad: 'T.M.F.',
    unidadNombre: 'Tonelada Métrica Fina',
    cotizacionUsd: 52004.5,
    cotizacionBob: 361951.32,
    variacionPct: 0.8,
    alicuotaRegalia: 5.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'ESTRATEGICOS',
  },
  {
    id: 'COT-CU',
    mineral: 'COBRE',
    simbolo: 'Cu',
    unidad: 'L.F.',
    unidadNombre: 'Libra Fina',
    cotizacionUsd: 6.35,
    cotizacionBob: 44.2,
    variacionPct: 0.5,
    alicuotaRegalia: 5.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'BASICOS',
  },
  {
    id: 'COT-BI',
    mineral: 'BISMUTO',
    simbolo: 'Bi',
    unidad: 'L.F.',
    unidadNombre: 'Libra Fina',
    cotizacionUsd: 13.1,
    cotizacionBob: 91.18,
    variacionPct: 0.0,
    alicuotaRegalia: 5.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'ESTRATEGICOS',
  },
  {
    id: 'COT-CAL-1',
    mineral: 'PIEDRA CALIZA',
    subtipo: 'Uso Industrial Estándar',
    simbolo: 'CaCO3',
    unidad: 'T.M.',
    unidadNombre: 'Tonelada Métrica',
    cotizacionUsd: 21.55,
    cotizacionBob: 149.99,
    variacionPct: 0.0,
    alicuotaRegalia: 3.0,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'NO_METALICOS',
  },
  {
    id: 'COT-CAL-2',
    mineral: 'PIEDRA CALIZA',
    subtipo: 'Alta Pureza / Procesada',
    simbolo: 'CaCO3',
    unidad: 'T.M.',
    unidadNombre: 'Tonelada Métrica',
    cotizacionUsd: 85.0,
    cotizacionBob: 591.6,
    variacionPct: 0.0,
    alicuotaRegalia: 3.5,
    quincena: '2ª. QUINCENA NOVIEMBRE 2026',
    fechaActualizacion: new Date().toISOString(),
    origen: 'OFICIAL',
    categoria: 'NO_METALICOS',
  },
];

// Estado en memoria mutable para permitir edición manual y alternancia de modos
let cotizacionesActuales: CotizacionItem[] = JSON.parse(JSON.stringify(COTIZACIONES_OFICIALES_BASE));
let modoActual: ModoCotizacion = 'OFICIAL';
const TIPO_CAMBIO_BCB = 6.96;

export async function cotizacionesRoutes(app: FastifyInstance) {
  // Obtener cotizaciones completas
  app.get('/api/cotizaciones', { preHandler: [authenticate] }, async (request, reply) => {
    return reply.send({
      modo: modoActual,
      tipoCambio: TIPO_CAMBIO_BCB,
      quincena: '2ª. QUINCENA NOVIEMBRE 2026',
      totalMinerales: cotizacionesActuales.length,
      ultimaActualizacion: new Date().toISOString(),
      cotizaciones: cotizacionesActuales,
    });
  });

  // Cambiar modo general (OFICIAL, EN_VIVO, MANUAL)
  app.post('/api/cotizaciones/modo', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      modo: z.enum(['OFICIAL', 'EN_VIVO', 'MANUAL']),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Modo inválido' });
    }

    modoActual = parsed.data.modo;

    if (modoActual === 'OFICIAL') {
      cotizacionesActuales = JSON.parse(JSON.stringify(COTIZACIONES_OFICIALES_BASE));
    } else if (modoActual === 'EN_VIVO') {
      // Aplicar ligeras fluctuaciones de mercado LME/Comex
      cotizacionesActuales = cotizacionesActuales.map((c) => {
        const factor = 1 + (Math.random() * 0.04 - 0.02);
        const nuevoUsd = Number((c.cotizacionUsd * factor).toFixed(2));
        return {
          ...c,
          cotizacionUsd: nuevoUsd,
          cotizacionBob: Number((nuevoUsd * TIPO_CAMBIO_BCB).toFixed(2)),
          origen: 'EN_VIVO',
          variacionPct: Number(((factor - 1) * 100).toFixed(2)),
          fechaActualizacion: new Date().toISOString(),
        };
      });
    } else if (modoActual === 'MANUAL') {
      cotizacionesActuales = cotizacionesActuales.map((c) => ({
        ...c,
        origen: 'MANUAL',
      }));
    }

    return reply.send({
      mensaje: `Modo de cotización cambiado a: ${modoActual}`,
      modo: modoActual,
      cotizaciones: cotizacionesActuales,
    });
  });

  // Actualizar cotización manual de un mineral específico
  app.put('/api/cotizaciones/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      cotizacionUsd: z.number().positive('El valor de cotización debe ser positivo'),
      alicuotaRegalia: z.number().min(0).max(100).optional(),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        mensaje: parsed.error.issues[0]?.message,
      });
    }

    const index = cotizacionesActuales.findIndex((c) => c.id === id);
    if (index === -1) {
      return reply.status(404).send({ error: 'Cotización no encontrada' });
    }

    const item = cotizacionesActuales[index];
    const nuevoUsd = parsed.data.cotizacionUsd;
    const nuevoBob = Number((nuevoUsd * TIPO_CAMBIO_BCB).toFixed(2));

    cotizacionesActuales[index] = {
      ...item,
      cotizacionUsd: nuevoUsd,
      cotizacionBob: nuevoBob,
      alicuotaRegalia: parsed.data.alicuotaRegalia ?? item.alicuotaRegalia,
      origen: 'MANUAL',
      fechaActualizacion: new Date().toISOString(),
    };

    modoActual = 'MANUAL';

    return reply.send({
      mensaje: `Cotización de ${item.mineral} actualizada manualmente a $US ${nuevoUsd}`,
      cotizacion: cotizacionesActuales[index],
      modo: modoActual,
    });
  });

  // Restaurar a valores oficiales de la 2ª Quincena
  app.post('/api/cotizaciones/reset', { preHandler: [authenticate] }, async (request, reply) => {
    cotizacionesActuales = JSON.parse(JSON.stringify(COTIZACIONES_OFICIALES_BASE));
    modoActual = 'OFICIAL';
    return reply.send({
      mensaje: 'Cotizaciones restablecidas a los valores oficiales de la 2ª Quincena Noviembre 2026',
      modo: modoActual,
      cotizaciones: cotizacionesActuales,
    });
  });

  // Simulador de Liquidación / Valorización de Minerales
  app.post('/api/cotizaciones/liquidar-estimacion', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      cotizacionId: z.string(),
      pesoKg: z.number().positive(),
      leyValor: z.number().min(0), // Porcentaje (%) o g/t según mineral
      leyUnidad: z.string(), // "%", "DM", "g/t"
      deduccionMaquilaUsd: z.number().min(0).default(0), // Costo de tratamiento/flete opcional
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parámetros inválidos para valorización' });
    }

    const { cotizacionId, pesoKg, leyValor, deduccionMaquilaUsd } = parsed.data;
    const cotizacion = cotizacionesActuales.find((c) => c.id === cotizacionId);
    if (!cotizacion) {
      return reply.status(404).send({ error: 'Cotización no encontrada' });
    }

    let pesoFinoEnUnidad = 0;
    // Conversiones mineras oficiales Bolivia
    // 1 TM = 1000 kg = 2204.62 Libras
    // 1 kg = 2.20462 Libras
    // 1 Onza Troy = 31.1035 gramos = 0.0311035 kg
    if (cotizacion.unidad === 'L.F.') {
      // Para estaño, zinc, plomo, cobre con ley en %:
      // Peso fino kg = pesoKg * (leyValor / 100)
      // LF = pesoFinoKg * 2.20462
      const pesoFinoKg = pesoKg * (leyValor / 100);
      pesoFinoEnUnidad = pesoFinoKg * 2.20462;
    } else if (cotizacion.unidad === 'O.T.') {
      // Para plata / oro con ley en g/t o %:
      // Si ley en g/t: gramos totales = (pesoKg / 1000) * leyValor
      // OT = gramos totales / 31.1035
      const tm = pesoKg / 1000;
      const gramosFinos = tm * leyValor;
      pesoFinoEnUnidad = gramosFinos / 31.1035;
    } else if (cotizacion.unidad === 'T.M.F.') {
      // Tonelada métrica fina:
      const tmNeto = pesoKg / 1000;
      pesoFinoEnUnidad = tmNeto * (leyValor / 100);
    } else {
      // T.M. bruta
      pesoFinoEnUnidad = pesoKg / 1000;
    }

    const valorBrutoUsd = pesoFinoEnUnidad * cotizacion.cotizacionUsd;
    const regaliaMineraUsd = valorBrutoUsd * (cotizacion.alicuotaRegalia / 100);
    const valorNetoUsd = Math.max(0, valorBrutoUsd - regaliaMineraUsd - deduccionMaquilaUsd);

    const valorBrutoBob = valorBrutoUsd * TIPO_CAMBIO_BCB;
    const regaliaMineraBob = regaliaMineraUsd * TIPO_CAMBIO_BCB;
    const valorNetoBob = valorNetoUsd * TIPO_CAMBIO_BCB;

    return reply.send({
      cotizacion,
      pesoKg,
      leyValor,
      pesoFinoEnUnidad: Number(pesoFinoEnUnidad.toFixed(4)),
      unidadFino: cotizacion.unidad,
      valorBrutoUsd: Number(valorBrutoUsd.toFixed(2)),
      valorBrutoBob: Number(valorBrutoBob.toFixed(2)),
      alicuotaRegaliaPct: cotizacion.alicuotaRegalia,
      regaliaMineraUsd: Number(regaliaMineraUsd.toFixed(2)),
      regaliaMineraBob: Number(regaliaMineraBob.toFixed(2)),
      deduccionMaquilaUsd,
      valorNetoUsd: Number(valorNetoUsd.toFixed(2)),
      valorNetoBob: Number(valorNetoBob.toFixed(2)),
      tipoCambio: TIPO_CAMBIO_BCB,
    });
  });
}
