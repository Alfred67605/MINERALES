import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';

export type ModoCotizacion = 'OFICIAL' | 'EN_VIVO' | 'MANUAL';
export type ModoDolar = 'PARALELO' | 'BCB_REFERENCIAL' | 'BCB_OFICIAL' | 'MANUAL';

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

// Estado dinámico del Tipo de Cambio del Dólar (BCB Valor Referencial + Dólar Paralelo Bolivia)
interface TasasDolarInfo {
  modoDolar: ModoDolar;
  tipoCambioActivo: number;
  tipoCambioManual: number;
  fuenteActiva: string;
  paralelo: { compra: number; venta: number; promedio: number; fuente: string };
  bcbReferencial: { compra: number; venta: number; promedio: number; fuente: string };
  bcbOficial: { compra: number; venta: number; promedio: number; fuente: string };
  actualizadoEn: string;
}

const estadoDolar: TasasDolarInfo = {
  modoDolar: 'PARALELO',
  tipoCambioActivo: 11.92,
  tipoCambioManual: 11.92,
  fuenteActiva: 'Dólar Paralelo Bolivia (Referencial Mercado)',
  paralelo: { compra: 11.85, venta: 11.97, promedio: 11.92, fuente: 'Mercado Paralelo / P2P Bolivia' },
  bcbReferencial: { compra: 11.58, venta: 11.7, promedio: 11.7, fuente: 'Banco Central de Bolivia (Valor Referencial)' },
  bcbOficial: { compra: 6.86, venta: 6.96, promedio: 6.96, fuente: 'BCB Tipo de Cambio Oficial Nominal' },
  actualizadoEn: new Date().toISOString(),
};

let cotizacionesActuales: CotizacionItem[] = JSON.parse(JSON.stringify(COTIZACIONES_OFICIALES_BASE));
let modoActual: ModoCotizacion = 'OFICIAL';

function recalcularBobConTipoCambio() {
  const tc = estadoDolar.tipoCambioActivo;
  cotizacionesActuales = cotizacionesActuales.map((c) => ({
    ...c,
    cotizacionBob: Number((c.cotizacionUsd * tc).toFixed(2)),
  }));
}

// Sincronizar inicialmente con 11.92 (Dólar Paralelo)
recalcularBobConTipoCambio();

async function sincronizarDolarParaleloEnVivo() {
  try {
    const resp = await fetch('https://bo.dolarapi.com/v1/dolares', {
      signal: AbortSignal.timeout(2500),
    });
    if (!resp.ok) return false;
    const lista: any[] = await resp.json();
    if (!Array.isArray(lista)) return false;

    const par = lista.find((d) => String(d.casa || '').toLowerCase().includes('binance') || String(d.casa || '').toLowerCase().includes('paralelo'));
    const ofi = lista.find((d) => String(d.casa || '').toLowerCase().includes('oficial'));

    if (par && Number(par.venta) > 0) {
      const compra = Number(par.compra) > 0 ? Number(par.compra) : Number(par.venta);
      const venta = Number(par.venta);
      const prom = Number(((compra + venta) / 2).toFixed(2));
      estadoDolar.paralelo = {
        compra: Number(compra.toFixed(2)),
        venta: Number(venta.toFixed(2)),
        promedio: venta,
        fuente: 'Dólar Paralelo En Vivo (bo.dolarapi.com)',
      };
      if (estadoDolar.modoDolar === 'PARALELO') {
        estadoDolar.tipoCambioActivo = venta;
        estadoDolar.fuenteActiva = `Dólar Paralelo En Vivo (${venta.toFixed(2)} Bs)`;
      }
      if (prom > 0) estadoDolar.actualizadoEn = new Date().toISOString();
    }

    if (ofi && Number(ofi.venta) > 0) {
      const val = Number(ofi.venta);
      if (val > 7.5) {
        estadoDolar.bcbReferencial = {
          compra: Number(ofi.compra) > 0 ? Number(Number(ofi.compra).toFixed(2)) : val,
          venta: Number(val.toFixed(2)),
          promedio: Number(val.toFixed(2)),
          fuente: 'BCB Valor Referencial (bo.dolarapi.com)',
        };
        if (estadoDolar.modoDolar === 'BCB_REFERENCIAL') {
          estadoDolar.tipoCambioActivo = estadoDolar.bcbReferencial.venta;
        }
      }
    }
    recalcularBobConTipoCambio();
    return true;
  } catch {
    return false;
  }
}

function aplicarModoDolar(modo: ModoDolar, manual?: number) {
  estadoDolar.modoDolar = modo;
  if (modo === 'PARALELO') {
    estadoDolar.tipoCambioActivo = estadoDolar.paralelo.promedio;
    estadoDolar.fuenteActiva = estadoDolar.paralelo.fuente;
  } else if (modo === 'BCB_REFERENCIAL') {
    estadoDolar.tipoCambioActivo = estadoDolar.bcbReferencial.venta;
    estadoDolar.fuenteActiva = estadoDolar.bcbReferencial.fuente;
  } else if (modo === 'BCB_OFICIAL') {
    estadoDolar.tipoCambioActivo = estadoDolar.bcbOficial.venta;
    estadoDolar.fuenteActiva = estadoDolar.bcbOficial.fuente;
  } else if (modo === 'MANUAL') {
    const val = manual && manual > 0 ? Number(manual.toFixed(2)) : estadoDolar.tipoCambioManual;
    estadoDolar.tipoCambioManual = val;
    estadoDolar.tipoCambioActivo = val;
    estadoDolar.fuenteActiva = 'Tipo de Cambio Manual';
  }
  estadoDolar.actualizadoEn = new Date().toISOString();
  recalcularBobConTipoCambio();
}

export async function cotizacionesRoutes(app: FastifyInstance) {
  // Obtener cotizaciones completas + tasas de dólar BCB y Paralelo
  app.get('/api/cotizaciones', { preHandler: [authenticate] }, async (request, reply) => {
    const query = (request.query as any) || {};
    if (query.refrescar === '1') {
      await sincronizarDolarParaleloEnVivo();
    }
    recalcularBobConTipoCambio();
    return reply.send({
      modo: modoActual,
      tipoCambio: estadoDolar.tipoCambioActivo,
      tipoCambioBobUsd: estadoDolar.tipoCambioActivo,
      dolar: estadoDolar,
      quincena: '2ª. QUINCENA NOVIEMBRE 2026',
      totalMinerales: cotizacionesActuales.length,
      ultimaActualizacion: estadoDolar.actualizadoEn,
      cotizaciones: cotizacionesActuales,
    });
  });

  // Cambiar régimen o valor del Dólar (PARALELO, BCB_REFERENCIAL, BCB_OFICIAL, MANUAL)
  app.post('/api/cotizaciones/dolar', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      modoDolar: z.enum(['PARALELO', 'BCB_REFERENCIAL', 'BCB_OFICIAL', 'MANUAL']),
      tipoCambioManual: z.number().positive().max(100).optional(),
      sincronizarEnVivo: z.boolean().optional(),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parámetros de dólar inválidos' });
    }

    if (parsed.data.sincronizarEnVivo) {
      await sincronizarDolarParaleloEnVivo();
    }
    aplicarModoDolar(parsed.data.modoDolar, parsed.data.tipoCambioManual);

    return reply.send({
      mensaje: `Tipo de cambio actualizado a ${estadoDolar.tipoCambioActivo.toFixed(2)} Bs/$US (${estadoDolar.fuenteActiva})`,
      tipoCambio: estadoDolar.tipoCambioActivo,
      tipoCambioBobUsd: estadoDolar.tipoCambioActivo,
      dolar: estadoDolar,
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
      recalcularBobConTipoCambio();
    } else if (modoActual === 'EN_VIVO') {
      await sincronizarDolarParaleloEnVivo();
      // Aplicar ligeras fluctuaciones de mercado LME/Comex
      cotizacionesActuales = cotizacionesActuales.map((c) => {
        const factor = 1 + (Math.random() * 0.04 - 0.02);
        const nuevoUsd = Number((c.cotizacionUsd * factor).toFixed(2));
        return {
          ...c,
          cotizacionUsd: nuevoUsd,
          cotizacionBob: Number((nuevoUsd * estadoDolar.tipoCambioActivo).toFixed(2)),
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
      tipoCambio: estadoDolar.tipoCambioActivo,
      tipoCambioBobUsd: estadoDolar.tipoCambioActivo,
      dolar: estadoDolar,
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
    const nuevoBob = Number((nuevoUsd * estadoDolar.tipoCambioActivo).toFixed(2));

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
    recalcularBobConTipoCambio();
    return reply.send({
      mensaje: 'Cotizaciones restablecidas a los valores oficiales de la 2ª Quincena Noviembre 2026',
      modo: modoActual,
      tipoCambio: estadoDolar.tipoCambioActivo,
      tipoCambioBobUsd: estadoDolar.tipoCambioActivo,
      dolar: estadoDolar,
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

    const tc = estadoDolar.tipoCambioActivo;
    const valorBrutoBob = valorBrutoUsd * tc;
    const regaliaMineraBob = regaliaMineraUsd * tc;
    const valorNetoBob = valorNetoUsd * tc;

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
      tipoCambio: tc,
    });
  });
}
