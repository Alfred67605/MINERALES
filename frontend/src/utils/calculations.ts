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
