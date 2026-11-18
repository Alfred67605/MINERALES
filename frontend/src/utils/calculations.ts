import { Decimal } from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type UnidadPeso = 'KG' | 'TM';
export type EstadoMedicionLey =
  | 'MEDIDO'
  | 'SIN_DATO'
  | 'NO_MEDIDO'
  | 'BAJO_LIMITE_DETECCION'
  | 'CERO_MEDIDO'
  | 'VALIDADO';

export interface LeyLoteItem {
  id?: string;
  catalogoLeyId: string;
  codigoLey: string;
  mineral: string;
  simbolo: string;
  nombreLey: string;
  unidadMedida: string;
  valor: number;
  valorStr: string;
  tipoEnsaye?: string;
  estadoMedicion?: EstadoMedicionLey;
  laboratorio?: string;
  nroCertificado?: string;
  metodoAnalisis?: string;
  versionActual?: number;
  validadoPor?: string;
  fechaEnsaye?: string;
  versiones?: any[];
}

export interface LoteItem {
  id: string;
  numeroLote: string;
  compraId: string;
  numeroCompra?: string | null;
  expedienteM02Compra?: string | null;
  estadoM02Compra?: string;
  proveedorId: string;
  proveedorNombre: string;
  proveedorCodigo: string;
  proveedorNim?: string;
  minaId?: string | null;
  minaOrigen: string;
  ubicacionId?: string | null;
  ubicacionCodigo?: string;
  ubicacionNombre?: string;
  ubicacionEsConceptual?: boolean;
  usuarioId: string;
  usuarioNombre: string;
  fechaCompra: string;
  cantidadSacos: number;
  pesoBrutoHumedo?: number;
  pesoTara?: number;
  pesoNeto: number;
  pesoNetoStr: string;
  humedadPct?: number;
  pesoSeco?: number | null;
  pesoSecoStr?: string;
  pesoKgEquivalente: number;
  pesoSecoKgEquivalente?: number;
  boletoPesaje?: string;
  metodoHumedad?: string;
  metodoMuestreo?: string;
  unidadPeso: UnidadPeso;
  tipoMineral: string;
  estado: 'DISPONIBLE' | 'VENDIDO' | 'RESERVADO' | 'PENDIENTE_ANALISIS' | 'BORRADOR' | 'APROBADO';
  observaciones: string;
  createdAt: string;
  updatedAt: string;
  leyes: LeyLoteItem[];
  movimientos?: any[];
  documentos?: any[];
  detalleVenta?: {
    id: string;
    ventaId: string;
    numeroVenta: string;
    fechaVenta: string;
    compradorNombre: string;
  } | null;
}

export interface PromedioLeyCalculado {
  codigoLey: string;
  mineral: string;
  simbolo: string;
  nombreLey: string;
  unidadMedida: string;
  leyPromedio: string;
  leyPromedioRedondeada: string;
  pesoBasePonderadoKg: string;
  contenidoFino: string;
  unidadFino: string;
  lotesIncluidos: number;
  lotesConFaltante: number;
  coberturaPct: string;
  advertenciaFaltantes: boolean;
}

export interface ResumenGrupoSeleccionado {
  totalLotes: number;
  totalSacos: number;
  pesoTotalKg: number;
  pesoTotalKgStr: string;
  pesoTotalTmStr: string;
  pesoTotalSecoKg: number;
  pesoTotalSecoKgStr: string;
  pesoTotalSecoTmStr: string;
  criterioPeso: 'PESO_NETO_CONVERTIDO_KG' | 'PESO_SECO_CONVERTIDO_KG';
  promediosLeyes: PromedioLeyCalculado[];
  advertencias: string[];
  errores: string[];
  esValido: boolean;
}

export function convertirPesoAKg(peso: string | number, unidad: UnidadPeso): Decimal {
  const val = new Decimal(peso || 0);
  return unidad === 'TM' ? val.mul(1000) : val;
}

export function calcularPesoNetoHumedo(
  bruto: string | number,
  tara: string | number = 0
): Decimal {
  return new Decimal(bruto || 0).sub(new Decimal(tara || 0));
}

export function calcularPesoSecoDesdeHumedad(
  pesoNetoHumedo: string | number | Decimal,
  humedadPct: string | number | Decimal = 0
): Decimal {
  const humedoDec = new Decimal(pesoNetoHumedo || 0);
  const hum = new Decimal(humedadPct || 0);
  if (hum.lte(0)) return humedoDec;
  if (hum.gte(100)) return new Decimal(0);
  return humedoDec.mul(new Decimal(1).sub(hum.div(100)));
}

export function calcularContenidoFino(
  pesoBaseKg: Decimal,
  leyPromedio: Decimal,
  unidadMedida: string
): { valorFino: Decimal; unidadFino: string } {
  const u = unidadMedida.trim();
  if (u === '%') {
    return {
      valorFino: pesoBaseKg.mul(leyPromedio).div(100),
      unidadFino: 'kg finos',
    };
  }
  if (u.toLowerCase() === 'g/t') {
    const toneladas = pesoBaseKg.div(1000);
    return {
      valorFino: toneladas.mul(leyPromedio),
      unidadFino: 'g finos',
    };
  }
  const toneladas = pesoBaseKg.div(1000);
  return {
    valorFino: toneladas.mul(leyPromedio),
    unidadFino: `${u}·TM`,
  };
}

export function calcularResumenEnTiempoReal(
  lotes: LoteItem[],
  decimalesFormato: number = 2,
  usarPesoSeco: boolean = false
): ResumenGrupoSeleccionado {
  const advertencias: string[] = [];
  const errores: string[] = [];

  if (!lotes || lotes.length === 0) {
    return {
      totalLotes: 0,
      totalSacos: 0,
      pesoTotalKg: 0,
      pesoTotalKgStr: '0,00',
      pesoTotalTmStr: '0,000',
      pesoTotalSecoKg: 0,
      pesoTotalSecoKgStr: '0,00',
      pesoTotalSecoTmStr: '0,000',
      criterioPeso: usarPesoSeco ? 'PESO_SECO_CONVERTIDO_KG' : 'PESO_NETO_CONVERTIDO_KG',
      promediosLeyes: [],
      advertencias: [],
      errores: [],
      esValido: true,
    };
  }

  let totalSacos = 0;
  let sumaPesoHumedoKg = new Decimal(0);
  let sumaPesoSecoKg = new Decimal(0);
  const tiposMinerales = new Set<string>();

  const mapaLeyes = new Map<
    string,
    {
      codigoLey: string;
      mineral: string;
      simbolo: string;
      nombreLey: string;
      unidadMedida: string;
      sumaProductoPesoPorLey: Decimal;
      sumaPesoConEstaLeyKg: Decimal;
      lotesIncluidos: number;
    }
  >();

  for (const lote of lotes) {
    if (lote.cantidadSacos <= 0) {
      errores.push(`Lote ${lote.numeroLote}: cantidad de sacos inválida.`);
    }

    let pesoHumedoKg: Decimal;
    try {
      pesoHumedoKg = convertirPesoAKg(lote.pesoNeto, lote.unidadPeso);
    } catch {
      errores.push(`Lote ${lote.numeroLote}: peso inválido.`);
      continue;
    }

    if (pesoHumedoKg.lte(0)) {
      errores.push(`Lote ${lote.numeroLote}: el peso debe ser mayor a cero.`);
      continue;
    }

    let pesoSecoKg = pesoHumedoKg;
    if (lote.pesoSeco !== null && lote.pesoSeco !== undefined && lote.pesoSeco > 0) {
      pesoSecoKg = convertirPesoAKg(lote.pesoSeco, lote.unidadPeso);
    } else if (lote.humedadPct && lote.humedadPct > 0) {
      pesoSecoKg = calcularPesoSecoDesdeHumedad(pesoHumedoKg, lote.humedadPct);
    }

    const pesoBasePonderacion = usarPesoSeco ? pesoSecoKg : pesoHumedoKg;

    totalSacos += lote.cantidadSacos;
    sumaPesoHumedoKg = sumaPesoHumedoKg.add(pesoHumedoKg);
    sumaPesoSecoKg = sumaPesoSecoKg.add(pesoSecoKg);
    if (lote.tipoMineral) tiposMinerales.add(lote.tipoMineral);

    if (!lote.leyes || lote.leyes.length === 0) {
      advertencias.push(`Lote ${lote.numeroLote}: no registra análisis de leyes.`);
      continue;
    }

    for (const ley of lote.leyes) {
      const estadoMed = ley.estadoMedicion || 'VALIDADO';
      if (
        estadoMed === 'SIN_DATO' ||
        estadoMed === 'NO_MEDIDO' ||
        estadoMed === 'BAJO_LIMITE_DETECCION'
      ) {
        advertencias.push(
          `Lote ${lote.numeroLote}: ley ${ley.simbolo} con estado "${estadoMed}" no se asume como 0.`
        );
        continue;
      }

      const valDec = estadoMed === 'CERO_MEDIDO' ? new Decimal(0) : new Decimal(ley.valor);
      if (valDec.lt(0)) {
        errores.push(`Lote ${lote.numeroLote}: ley negativa en ${ley.nombreLey}.`);
        continue;
      }

      const clave = `${ley.codigoLey}__${ley.simbolo}__${ley.unidadMedida}`;
      const actual = mapaLeyes.get(clave) || {
        codigoLey: ley.codigoLey,
        mineral: ley.mineral,
        simbolo: ley.simbolo,
        nombreLey: ley.nombreLey,
        unidadMedida: ley.unidadMedida,
        sumaProductoPesoPorLey: new Decimal(0),
        sumaPesoConEstaLeyKg: new Decimal(0),
        lotesIncluidos: 0,
      };

      actual.sumaProductoPesoPorLey = actual.sumaProductoPesoPorLey.add(
        pesoBasePonderacion.mul(valDec)
      );
      actual.sumaPesoConEstaLeyKg = actual.sumaPesoConEstaLeyKg.add(pesoBasePonderacion);
      actual.lotesIncluidos += 1;

      mapaLeyes.set(clave, actual);
    }
  }

  if (tiposMinerales.size > 1) {
    advertencias.push(
      `Atención: Ha seleccionado lotes de distintos tipos de material (${Array.from(tiposMinerales).join(', ')}).`
    );
  }

  const promediosLeyes: PromedioLeyCalculado[] = [];
  const totalLotes = lotes.length;

  for (const [, item] of mapaLeyes.entries()) {
    if (item.sumaPesoConEstaLeyKg.gt(0)) {
      const promedio = item.sumaProductoPesoPorLey.div(item.sumaPesoConEstaLeyKg);
      const faltantes = totalLotes - item.lotesIncluidos;
      const coberturaPct = new Decimal(item.lotesIncluidos)
        .div(totalLotes)
        .mul(100)
        .toFixed(1);

      const { valorFino, unidadFino } = calcularContenidoFino(
        item.sumaPesoConEstaLeyKg,
        promedio,
        item.unidadMedida
      );

      if (faltantes > 0) {
        advertencias.push(
          `Cobertura parcial en ${item.simbolo} (${item.unidadMedida}): medido en ${item.lotesIncluidos}/${totalLotes} lotes (${coberturaPct}%). Los ${faltantes} lote(s) sin este análisis NO se asumen como 0.`
        );
      }

      promediosLeyes.push({
        codigoLey: item.codigoLey,
        mineral: item.mineral,
        simbolo: item.simbolo,
        nombreLey: leyNombreLimpio(item.nombreLey),
        unidadMedida: item.unidadMedida,
        leyPromedio: promedio.toFixed(4),
        leyPromedioRedondeada: promedio.toFixed(decimalesFormato),
        pesoBasePonderadoKg: item.sumaPesoConEstaLeyKg.toFixed(2),
        contenidoFino: formatearNumeroBolivia(Number(valorFino.toFixed(2)), 2),
        unidadFino,
        lotesIncluidos: item.lotesIncluidos,
        lotesConFaltante: faltantes,
        coberturaPct,
        advertenciaFaltantes: faltantes > 0,
      });
    }
  }

  const pesoMostradoKg = usarPesoSeco ? sumaPesoSecoKg : sumaPesoHumedoKg;

  return {
    totalLotes,
    totalSacos,
    pesoTotalKg: Number(pesoMostradoKg.toFixed(2)),
    pesoTotalKgStr: formatearNumeroBolivia(Number(pesoMostradoKg.toFixed(2)), 2),
    pesoTotalTmStr: formatearNumeroBolivia(Number(pesoMostradoKg.div(1000).toFixed(3)), 3),
    pesoTotalSecoKg: Number(sumaPesoSecoKg.toFixed(2)),
    pesoTotalSecoKgStr: formatearNumeroBolivia(Number(sumaPesoSecoKg.toFixed(2)), 2),
    pesoTotalSecoTmStr: formatearNumeroBolivia(Number(sumaPesoSecoKg.div(1000).toFixed(3)), 3),
    criterioPeso: usarPesoSeco ? 'PESO_SECO_CONVERTIDO_KG' : 'PESO_NETO_CONVERTIDO_KG',
    promediosLeyes,
    advertencias,
    errores,
    esValido: errores.length === 0,
  };
}

function leyNombreLimpio(nombre: string) {
  return nombre;
}

export function formatearNumeroBolivia(valor: number | string, decimales: number = 2): string {
  const num = typeof valor === 'string' ? parseFloat(valor) : valor;
  if (isNaN(num)) return '0,00';
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(num);
}

export function formatearEnteroBolivia(valor: number | string): string {
  const num = typeof valor === 'string' ? parseInt(valor, 10) : valor;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatearFechaBolivia(fechaIso: string | Date): string {
  if (!fechaIso) return '-';
  const d = typeof fechaIso === 'string' ? new Date(fechaIso) : fechaIso;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function getMineralBadgeClass(simbolo: string): string {
  const s = (simbolo || '').toLowerCase();
  if (s === 'au') return 'badge-mineral-au';
  if (s === 'sn') return 'badge-mineral-sn';
  if (s === 'ag') return 'badge-mineral-ag';
  if (s === 'zn') return 'badge-mineral-zn';
  if (s === 'pb') return 'badge-mineral-pb';
  if (s === 'cu') return 'badge-mineral-cu';
  return 'bg-slate-100 dark:bg-[#0F2232] text-slate-800 dark:text-slate-100 border-slate-300 dark:border-[#1A364E]';
}

// ================= MOTOR DE VALORIZACIÓN FINANCIERA EN BS Y USD (POR LOTE Y POR SACO) =================

export const TIPO_CAMBIO_OFICIAL_BOB = 6.96;

export interface CotizacionReferencia {
  id?: string;
  simbolo: string;
  mineral?: string;
  unidad: 'L.F.' | 'O.T.' | 'T.M.F.' | 'T.M.' | string;
  cotizacionUsd: number;
  cotizacionBob?: number;
  alicuotaRegalia: number;
}

export const COTIZACIONES_OFICIALES_FALLBACK: CotizacionReferencia[] = [
  { id: 'COT-ZN', simbolo: 'Zn', mineral: 'ZINC', unidad: 'L.F.', cotizacionUsd: 1.73, cotizacionBob: 12.04, alicuotaRegalia: 5.0 },
  { id: 'COT-SN', simbolo: 'Sn', mineral: 'ESTAÑO', unidad: 'L.F.', cotizacionUsd: 21.53, cotizacionBob: 149.85, alicuotaRegalia: 5.0 },
  { id: 'COT-AU-STD', simbolo: 'Au', mineral: 'ORO', unidad: 'O.T.', cotizacionUsd: 4010.22, cotizacionBob: 27911.13, alicuotaRegalia: 7.0 },
  { id: 'COT-AG', simbolo: 'Ag', mineral: 'PLATA', unidad: 'O.T.', cotizacionUsd: 51.46, cotizacionBob: 358.16, alicuotaRegalia: 6.0 },
  { id: 'COT-SB', simbolo: 'Sb', mineral: 'ANTIMONIO', unidad: 'T.M.F.', cotizacionUsd: 16475.0, cotizacionBob: 114666.0, alicuotaRegalia: 5.0 },
  { id: 'COT-PB', simbolo: 'Pb', mineral: 'PLOMO', unidad: 'L.F.', cotizacionUsd: 0.84, cotizacionBob: 5.85, alicuotaRegalia: 5.0 },
  { id: 'COT-W', simbolo: 'W', mineral: 'WOLFRAM', unidad: 'T.M.F.', cotizacionUsd: 52004.5, cotizacionBob: 361951.32, alicuotaRegalia: 5.0 },
  { id: 'COT-CU', simbolo: 'Cu', mineral: 'COBRE', unidad: 'L.F.', cotizacionUsd: 6.35, cotizacionBob: 44.2, alicuotaRegalia: 5.0 },
  { id: 'COT-BI', simbolo: 'Bi', mineral: 'BISMUTO', unidad: 'L.F.', cotizacionUsd: 13.1, cotizacionBob: 91.18, alicuotaRegalia: 5.0 },
];

export interface ValorizacionMineralDetalle {
  simbolo: string;
  mineral: string;
  unidadCotizacion: string;
  precioUsd: number;
  alicuotaRegalia: number;
  cantidadUnidadesPagables: number;
  valorBrutoUsd: number;
  valorBrutoBob: number;
  regaliaUsd: number;
  regaliaBob: number;
  valorNetoUsd: number;
  valorNetoBob: number;
}

export interface ValorizacionLote {
  loteId?: string;
  numeroLote?: string;
  cantidadSacos: number;
  pesoBaseKg: number;
  pesoPorSacoKg: number;
  valorBrutoUsd: number;
  valorBrutoBob: number;
  regaliaUsd: number;
  regaliaBob: number;
  valorNetoUsd: number;
  valorNetoBob: number;
  valorPorSacoUsd: number;
  valorPorSacoBob: number;
  valorPorKgBob: number;
  desglose: ValorizacionMineralDetalle[];
}

export interface ValorizacionGrupo {
  totalLotes: number;
  totalSacos: number;
  pesoTotalKg: number;
  pesoPromedioPorSacoKg: number;
  sacosPromedioPorLote: number;
  valorBrutoTotalUsd: number;
  valorBrutoTotalBob: number;
  regaliaTotalUsd: number;
  regaliaTotalBob: number;
  valorNetoTotalUsd: number;
  valorNetoTotalBob: number;
  valorPromedioPorSacoUsd: number;
  valorPromedioPorSacoBob: number;
  valorPromedioPorLoteUsd: number;
  valorPromedioPorLoteBob: number;
  valorPromedioPorKgBob: number;
  desglosePorMineral: ValorizacionMineralDetalle[];
  porLoteId: Record<string, ValorizacionLote>;
}

export function formatearMonedaBob(valor: number | string, decimales: number = 2): string {
  return `Bs ${formatearNumeroBolivia(valor, decimales)}`;
}

export function formatearMonedaUsd(valor: number | string, decimales: number = 2): string {
  return `$US ${formatearNumeroBolivia(valor, decimales)}`;
}

function buscarCotizacionParaSimbolo(
  simbolo: string,
  cotizaciones: CotizacionReferencia[]
): CotizacionReferencia | undefined {
  const s = (simbolo || '').trim().toLowerCase();
  const lista = cotizaciones && cotizaciones.length > 0 ? cotizaciones : COTIZACIONES_OFICIALES_FALLBACK;
  return (
    lista.find((c) => c.id === 'COT-AU-STD' && s === 'au') ||
    lista.find((c) => (c.simbolo || '').trim().toLowerCase() === s) ||
    COTIZACIONES_OFICIALES_FALLBACK.find((c) => (c.simbolo || '').trim().toLowerCase() === s)
  );
}

export interface LoteParaValorizar {
  id?: string;
  numeroLote?: string;
  cantidadSacos?: number;
  sacosRegistrados?: number;
  pesoNeto?: number;
  pesoRegistrado?: number;
  pesoSeco?: number | null;
  pesoSecoRegistrado?: number | null;
  humedadPct?: number;
  humedadRegistradaPct?: number | null;
  pesoKgEquivalente?: number;
  pesoKgCalculado?: number;
  unidadPeso?: UnidadPeso;
  unidadPesoRegistrada?: UnidadPeso;
  leyes?: Array<{
    simbolo: string;
    mineral?: string;
    unidadMedida: string;
    valor?: number;
    valorStr?: string;
    estadoMedicion?: string;
  }>;
  leyesSnapshot?: Array<{
    simbolo: string;
    mineral?: string;
    unidadMedida: string;
    valor?: number;
    valorStr?: string;
    estadoMedicion?: string;
  }>;
}

export function calcularValorizacionLote(
  lote: LoteParaValorizar,
  cotizaciones: CotizacionReferencia[] = COTIZACIONES_OFICIALES_FALLBACK,
  usarPesoSeco: boolean = false,
  tipoCambio: number = TIPO_CAMBIO_OFICIAL_BOB
): ValorizacionLote {
  const sacos = Math.max(1, Number(lote.cantidadSacos ?? lote.sacosRegistrados ?? 1));
  const unidad = lote.unidadPeso ?? lote.unidadPesoRegistrada ?? 'KG';
  const tc = tipoCambio > 0 ? tipoCambio : TIPO_CAMBIO_OFICIAL_BOB;

  let pesoHumedoKg =
    lote.pesoKgEquivalente !== undefined
      ? new Decimal(lote.pesoKgEquivalente)
      : lote.pesoKgCalculado !== undefined
      ? new Decimal(lote.pesoKgCalculado)
      : convertirPesoAKg(lote.pesoNeto ?? lote.pesoRegistrado ?? 0, unidad);

  if (pesoHumedoKg.lt(0)) pesoHumedoKg = new Decimal(0);

  let pesoBaseKg = pesoHumedoKg;
  if (usarPesoSeco) {
    const secoDirecto = lote.pesoSeco ?? lote.pesoSecoRegistrado;
    const hum = lote.humedadPct ?? lote.humedadRegistradaPct ?? 0;
    if (secoDirecto !== null && secoDirecto !== undefined && secoDirecto > 0) {
      pesoBaseKg = convertirPesoAKg(secoDirecto, unidad);
    } else if (hum > 0) {
      pesoBaseKg = calcularPesoSecoDesdeHumedad(pesoHumedoKg, hum);
    }
  }

  const leyesLista = lote.leyes ?? lote.leyesSnapshot ?? [];
  let brutoTotalUsd = new Decimal(0);
  let regaliaTotalUsd = new Decimal(0);
  const desglose: ValorizacionMineralDetalle[] = [];

  for (const ley of leyesLista) {
    const estadoMed = ley.estadoMedicion || 'VALIDADO';
    if (
      estadoMed === 'SIN_DATO' ||
      estadoMed === 'NO_MEDIDO' ||
      estadoMed === 'BAJO_LIMITE_DETECCION'
    ) {
      continue;
    }

    const valorNum =
      estadoMed === 'CERO_MEDIDO'
        ? 0
        : Number(ley.valor ?? (ley.valorStr ? parseFloat(ley.valorStr) : 0));

    if (!valorNum || valorNum <= 0) continue;

    const cot = buscarCotizacionParaSimbolo(ley.simbolo, cotizaciones);
    if (!cot) continue;

    const valDec = new Decimal(valorNum);
    const unidadLey = (ley.unidadMedida || '').trim().toLowerCase();
    let unidadesPagables = new Decimal(0);

    if (cot.unidad === 'L.F.') {
      if (unidadLey === '%') {
        unidadesPagables = pesoBaseKg.mul(valDec.div(100)).mul(2.20462);
      } else if (unidadLey === 'g/t') {
        unidadesPagables = pesoBaseKg.div(1000).mul(valDec).div(1000).mul(2.20462);
      }
    } else if (cot.unidad === 'O.T.') {
      if (unidadLey === 'g/t') {
        unidadesPagables = pesoBaseKg.div(1000).mul(valDec).div(31.1035);
      } else if (unidadLey === 'dm') {
        // 1 DM en minería boliviana = 100 g/t
        unidadesPagables = pesoBaseKg.div(1000).mul(valDec.mul(100)).div(31.1035);
      } else if (unidadLey === '%') {
        unidadesPagables = pesoBaseKg.mul(valDec.div(100)).mul(1000).div(31.1035);
      }
    } else if (cot.unidad === 'T.M.F.') {
      if (unidadLey === '%') {
        unidadesPagables = pesoBaseKg.div(1000).mul(valDec.div(100));
      }
    } else {
      unidadesPagables = pesoBaseKg.div(1000);
    }

    if (unidadesPagables.lte(0)) continue;

    const brutoMinUsd = unidadesPagables.mul(cot.cotizacionUsd);
    const regMinUsd = brutoMinUsd.mul(new Decimal(cot.alicuotaRegalia).div(100));
    const netoMinUsd = brutoMinUsd.sub(regMinUsd);

    brutoTotalUsd = brutoTotalUsd.add(brutoMinUsd);
    regaliaTotalUsd = regaliaTotalUsd.add(regMinUsd);

    desglose.push({
      simbolo: ley.simbolo,
      mineral: ley.mineral || cot.mineral || ley.simbolo,
      unidadCotizacion: cot.unidad,
      precioUsd: Number(cot.cotizacionUsd),
      alicuotaRegalia: Number(cot.alicuotaRegalia),
      cantidadUnidadesPagables: Number(unidadesPagables.toFixed(4)),
      valorBrutoUsd: Number(brutoMinUsd.toFixed(2)),
      valorBrutoBob: Number(brutoMinUsd.mul(tc).toFixed(2)),
      regaliaUsd: Number(regMinUsd.toFixed(2)),
      regaliaBob: Number(regMinUsd.mul(tc).toFixed(2)),
      valorNetoUsd: Number(netoMinUsd.toFixed(2)),
      valorNetoBob: Number(netoMinUsd.mul(tc).toFixed(2)),
    });
  }

  const netoTotalUsd = brutoTotalUsd.sub(regaliaTotalUsd);
  const brutoTotalBob = brutoTotalUsd.mul(tc);
  const regaliaTotalBob = regaliaTotalUsd.mul(tc);
  const netoTotalBob = netoTotalUsd.mul(tc);

  const pesoNumKg = Number(pesoBaseKg.toFixed(2));
  const sacosReal = Number(lote.cantidadSacos ?? lote.sacosRegistrados ?? 0);

  return {
    loteId: lote.id,
    numeroLote: lote.numeroLote,
    cantidadSacos: sacosReal,
    pesoBaseKg: pesoNumKg,
    pesoPorSacoKg: sacosReal > 0 ? Number(pesoBaseKg.div(sacosReal).toFixed(2)) : 0,
    valorBrutoUsd: Number(brutoTotalUsd.toFixed(2)),
    valorBrutoBob: Number(brutoTotalBob.toFixed(2)),
    regaliaUsd: Number(regaliaTotalUsd.toFixed(2)),
    regaliaBob: Number(regaliaTotalBob.toFixed(2)),
    valorNetoUsd: Number(netoTotalUsd.toFixed(2)),
    valorNetoBob: Number(netoTotalBob.toFixed(2)),
    valorPorSacoUsd: sacosReal > 0 ? Number(netoTotalUsd.div(sacosReal).toFixed(2)) : 0,
    valorPorSacoBob: sacosReal > 0 ? Number(netoTotalBob.div(sacosReal).toFixed(2)) : 0,
    valorPorKgBob: pesoBaseKg.gt(0) ? Number(netoTotalBob.div(pesoBaseKg).toFixed(2)) : 0,
    desglose,
  };
}

export function calcularValorizacionGrupo(
  lotes: LoteParaValorizar[],
  cotizaciones: CotizacionReferencia[] = COTIZACIONES_OFICIALES_FALLBACK,
  usarPesoSeco: boolean = false,
  tipoCambio: number = TIPO_CAMBIO_OFICIAL_BOB
): ValorizacionGrupo {
  const porLoteId: Record<string, ValorizacionLote> = {};
  const mapaMinerales = new Map<string, ValorizacionMineralDetalle>();

  let totalSacos = 0;
  let pesoTotal = new Decimal(0);
  let brutoUsd = new Decimal(0);
  let brutoBob = new Decimal(0);
  let regaliaUsd = new Decimal(0);
  let regaliaBob = new Decimal(0);
  let netoUsd = new Decimal(0);
  let netoBob = new Decimal(0);

  for (const lote of lotes) {
    const val = calcularValorizacionLote(lote, cotizaciones, usarPesoSeco, tipoCambio);
    if (lote.id) porLoteId[lote.id] = val;

    totalSacos += val.cantidadSacos;
    pesoTotal = pesoTotal.add(val.pesoBaseKg);
    brutoUsd = brutoUsd.add(val.valorBrutoUsd);
    brutoBob = brutoBob.add(val.valorBrutoBob);
    regaliaUsd = regaliaUsd.add(val.regaliaUsd);
    regaliaBob = regaliaBob.add(val.regaliaBob);
    netoUsd = netoUsd.add(val.valorNetoUsd);
    netoBob = netoBob.add(val.valorNetoBob);

    for (const d of val.desglose) {
      const prev = mapaMinerales.get(d.simbolo) || {
        simbolo: d.simbolo,
        mineral: d.mineral,
        unidadCotizacion: d.unidadCotizacion,
        precioUsd: d.precioUsd,
        alicuotaRegalia: d.alicuotaRegalia,
        cantidadUnidadesPagables: 0,
        valorBrutoUsd: 0,
        valorBrutoBob: 0,
        regaliaUsd: 0,
        regaliaBob: 0,
        valorNetoUsd: 0,
        valorNetoBob: 0,
      };
      prev.cantidadUnidadesPagables = Number(
        new Decimal(prev.cantidadUnidadesPagables).add(d.cantidadUnidadesPagables).toFixed(4)
      );
      prev.valorBrutoUsd = Number(new Decimal(prev.valorBrutoUsd).add(d.valorBrutoUsd).toFixed(2));
      prev.valorBrutoBob = Number(new Decimal(prev.valorBrutoBob).add(d.valorBrutoBob).toFixed(2));
      prev.regaliaUsd = Number(new Decimal(prev.regaliaUsd).add(d.regaliaUsd).toFixed(2));
      prev.regaliaBob = Number(new Decimal(prev.regaliaBob).add(d.regaliaBob).toFixed(2));
      prev.valorNetoUsd = Number(new Decimal(prev.valorNetoUsd).add(d.valorNetoUsd).toFixed(2));
      prev.valorNetoBob = Number(new Decimal(prev.valorNetoBob).add(d.valorNetoBob).toFixed(2));
      mapaMinerales.set(d.simbolo, prev);
    }
  }

  const totalLotes = lotes.length;

  return {
    totalLotes,
    totalSacos,
    pesoTotalKg: Number(pesoTotal.toFixed(2)),
    pesoPromedioPorSacoKg: totalSacos > 0 ? Number(pesoTotal.div(totalSacos).toFixed(2)) : 0,
    sacosPromedioPorLote: totalLotes > 0 ? Number((totalSacos / totalLotes).toFixed(1)) : 0,
    valorBrutoTotalUsd: Number(brutoUsd.toFixed(2)),
    valorBrutoTotalBob: Number(brutoBob.toFixed(2)),
    regaliaTotalUsd: Number(regaliaUsd.toFixed(2)),
    regaliaTotalBob: Number(regaliaBob.toFixed(2)),
    valorNetoTotalUsd: Number(netoUsd.toFixed(2)),
    valorNetoTotalBob: Number(netoBob.toFixed(2)),
    valorPromedioPorSacoUsd: totalSacos > 0 ? Number(netoUsd.div(totalSacos).toFixed(2)) : 0,
    valorPromedioPorSacoBob: totalSacos > 0 ? Number(netoBob.div(totalSacos).toFixed(2)) : 0,
    valorPromedioPorLoteUsd: totalLotes > 0 ? Number(netoUsd.div(totalLotes).toFixed(2)) : 0,
    valorPromedioPorLoteBob: totalLotes > 0 ? Number(netoBob.div(totalLotes).toFixed(2)) : 0,
    valorPromedioPorKgBob: pesoTotal.gt(0) ? Number(netoBob.div(pesoTotal).toFixed(2)) : 0,
    desglosePorMineral: Array.from(mapaMinerales.values()).sort(
      (a, b) => b.valorNetoBob - a.valorNetoBob
    ),
    porLoteId,
  };
}
