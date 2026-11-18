import { Decimal } from 'decimal.js';

// Configuración de alta precisión para cálculos mineralúrgicos (sin flotantes binarios)
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type UnidadPesoInput = 'KG' | 'TM';
export type EstadoMedicionInput =
  | 'MEDIDO'
  | 'SIN_DATO'
  | 'NO_MEDIDO'
  | 'BAJO_LIMITE_DETECCION'
  | 'CERO_MEDIDO'
  | 'VALIDADO';

export interface LeyLoteInput {
  codigoLey: string;
  mineral: string;
  simbolo: string;
  nombreLey: string;
  unidadMedida: string;
  valor?: string | number | Decimal | null;
  estadoMedicion?: EstadoMedicionInput;
}

export interface LoteCalculoInput {
  id: string;
  numeroLote: string;
  cantidadSacos: number;
  pesoBrutoHumedo?: string | number | Decimal | null;
  pesoTara?: string | number | Decimal | null;
  pesoNeto: string | number | Decimal;
  pesoSeco?: string | number | Decimal | null;
  humedadPct?: string | number | Decimal | null;
  unidadPeso: UnidadPesoInput;
  tipoMineral: string;
  leyes: LeyLoteInput[];
}

export interface PromedioLeyResultado {
  codigoLey: string;
  mineral: string;
  simbolo: string;
  nombreLey: string;
  unidadMedida: string;
  leyPromedio: string;           // 4 decimales exactos
  leyPromedioRedondeada: string; // 2 decimales de presentación
  pesoBasePonderadoKg: string;
  contenidoFino: string;         // Contenido fino (kg para %, g para g/t, DM·TM para DM)
  unidadFino: string;
  lotesIncluidos: number;
  lotesConFaltante: number;
  coberturaPct: string;          // Porcentaje de lotes del grupo con dato válido (ej. "100.00" o "95.00")
  advertenciaFaltantes: boolean;
}

export interface ResultadoCalculoGrupo {
  totalLotes: number;
  totalSacos: number;
  pesoTotalKg: string;
  pesoTotalTm: string;
  pesoTotalSecoKg: string;
  pesoTotalSecoTm: string;
  criterioPeso: 'PESO_NETO_CONVERTIDO_KG' | 'PESO_SECO_CONVERTIDO_KG';
  promediosLeyes: PromedioLeyResultado[];
  advertencias: string[];
  errores: string[];
  esValido: boolean;
}

/**
 * Convierte cualquier peso (KG o TM) a Kilogramos con precisión Decimal exacta.
 * 1 TM (Tonelada Métrica) = 1.000 KG.
 */
export function convertirPesoAKg(peso: string | number | Decimal, unidad: UnidadPesoInput): Decimal {
  const valor = new Decimal(peso);
  if (unidad === 'TM') {
    return valor.mul(1000);
  }
  return valor;
}

/**
 * Calcula el Peso Neto Húmedo (kg) = Peso Bruto Húmedo - Tara
 */
export function calcularPesoNetoHumedo(
  pesoBruto: string | number | Decimal,
  tara: string | number | Decimal = 0
): Decimal {
  const brutoDec = new Decimal(pesoBruto || 0);
  const taraDec = new Decimal(tara || 0);
  return brutoDec.sub(taraDec);
}

/**
 * Calcula el Peso Neto Seco = Peso Neto Húmedo × (1 - Humedad% / 100)
 * conforme a método ISO 10251 cuando aplica humedad.
 */
export function calcularPesoSecoDesdeHumedad(
  pesoNetoHumedo: string | number | Decimal,
  humedadPct: string | number | Decimal = 0
): Decimal {
  const humedoDec = new Decimal(pesoNetoHumedo || 0);
  const humPct = new Decimal(humedadPct || 0);
  if (humPct.lte(0)) return humedoDec;
  if (humPct.gte(100)) return new Decimal(0);
  const factorSeco = new Decimal(1).sub(humPct.div(100));
  return humedoDec.mul(factorSeco);
}

/**
 * Calcula el contenido fino según la dimensión física de la unidad de ley:
 * - Si unidad es "%": Contenido fino (kg) = Peso base (kg) × Ley(%) / 100
 * - Si unidad es "g/t": Contenido fino (g) = Toneladas base (peso_kg / 1000) × Ley(g/t)
 * - Si unidad es "DM": Contenido fino (DM·TM) = Toneladas base × Ley(DM)
 */
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

/**
 * Motor determinístico de cálculo en tiempo real para grupos de lotes mineros.
 * Ley promedio = Σ(Peso_base_kg del lote × Ley del lote) / Σ(Peso_base_kg de los lotes con análisis compatible)
 */
export function calcularResumenLotes(
  lotes: LoteCalculoInput[],
  usarPesoSecoSiExiste: boolean = false
): ResultadoCalculoGrupo {
  const advertencias: string[] = [];
  const errores: string[] = [];

  if (!lotes || lotes.length === 0) {
    return {
      totalLotes: 0,
      totalSacos: 0,
      pesoTotalKg: '0.0000',
      pesoTotalTm: '0.0000',
      pesoTotalSecoKg: '0.0000',
      pesoTotalSecoTm: '0.0000',
      criterioPeso: usarPesoSecoSiExiste ? 'PESO_SECO_CONVERTIDO_KG' : 'PESO_NETO_CONVERTIDO_KG',
      promediosLeyes: [],
      advertencias: [],
      errores: [],
      esValido: true,
    };
  }

  let totalSacos = 0;
  let sumaPesoTotalHumedoKg = new Decimal(0);
  let sumaPesoTotalSecoKg = new Decimal(0);

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

  const tiposMineralSet = new Set<string>();

  for (const lote of lotes) {
    if (!Number.isInteger(lote.cantidadSacos) || lote.cantidadSacos <= 0) {
      errores.push(`El lote ${lote.numeroLote} tiene una cantidad de sacos inválida (${lote.cantidadSacos}).`);
    }

    // Validar consistencia de Peso Bruto - Tara si ambos están presentes
    if (
      lote.pesoBrutoHumedo !== undefined &&
      lote.pesoBrutoHumedo !== null &&
      lote.pesoTara !== undefined &&
      lote.pesoTara !== null
    ) {
      try {
        const netoEsperado = calcularPesoNetoHumedo(lote.pesoBrutoHumedo, lote.pesoTara);
        if (netoEsperado.lte(0)) {
          errores.push(`El lote ${lote.numeroLote} tiene Peso Bruto menor o igual a la Tara.`);
        }
      } catch {
        errores.push(`El lote ${lote.numeroLote} tiene valores inválidos de Peso Bruto o Tara.`);
      }
    }

    let pesoHumedoKg: Decimal;
    try {
      pesoHumedoKg = convertirPesoAKg(lote.pesoNeto, lote.unidadPeso);
    } catch {
      errores.push(`El lote ${lote.numeroLote} tiene un formato de peso inválido.`);
      continue;
    }

    if (pesoHumedoKg.lte(0)) {
      errores.push(`El lote ${lote.numeroLote} tiene un peso menor o igual a cero (${pesoHumedoKg.toFixed(2)} kg).`);
      continue;
    }

    // Calcular peso seco del lote (si existe pesoSeco explícito o humedadPct)
    let pesoSecoKg: Decimal = pesoHumedoKg;
    if (lote.pesoSeco !== null && lote.pesoSeco !== undefined && lote.pesoSeco !== '') {
      try {
        const ps = convertirPesoAKg(lote.pesoSeco, lote.unidadPeso);
        if (ps.gt(0)) pesoSecoKg = ps;
      } catch {
        // Fallback a humedadPct
      }
    } else if (lote.humedadPct !== null && lote.humedadPct !== undefined && lote.humedadPct !== '') {
      try {
        pesoSecoKg = calcularPesoSecoDesdeHumedad(pesoHumedoKg, lote.humedadPct);
      } catch {
        pesoSecoKg = pesoHumedoKg;
      }
    }

    const pesoBasePonderacionKg = usarPesoSecoSiExiste ? pesoSecoKg : pesoHumedoKg;

    totalSacos += lote.cantidadSacos;
    sumaPesoTotalHumedoKg = sumaPesoTotalHumedoKg.add(pesoHumedoKg);
    sumaPesoTotalSecoKg = sumaPesoTotalSecoKg.add(pesoSecoKg);

    if (lote.tipoMineral) {
      tiposMineralSet.add(lote.tipoMineral);
    }

    if (!lote.leyes || lote.leyes.length === 0) {
      advertencias.push(`El lote ${lote.numeroLote} no tiene análisis de leyes registrados.`);
      continue;
    }

    const leyesVistasEnLote = new Set<string>();

    for (const ley of lote.leyes) {
      const estadoMed = ley.estadoMedicion || 'VALIDADO';

      // Diferenciar valor faltante / no medido / bajo límite de detección vs cero medido real
      if (
        estadoMed === 'SIN_DATO' ||
        estadoMed === 'NO_MEDIDO' ||
        estadoMed === 'BAJO_LIMITE_DETECCION' ||
        ley.valor === null ||
        ley.valor === undefined ||
        ley.valor === ''
      ) {
        advertencias.push(
          `El lote ${lote.numeroLote} registra estado "${estadoMed}" en ${ley.nombreLey} (no se asume como cero).`
        );
        continue;
      }

      let valorLeyDec: Decimal;
      try {
        valorLeyDec = new Decimal(ley.valor);
      } catch {
        errores.push(`Valor de ley inválido en lote ${lote.numeroLote} para ${ley.nombreLey}.`);
        continue;
      }

      if (valorLeyDec.lt(0)) {
        errores.push(`El lote ${lote.numeroLote} tiene una ley negativa en ${ley.nombreLey} (${valorLeyDec.toString()}).`);
        continue;
      }

      // Si el estado es CERO_MEDIDO, el valor es legítimamente 0 y sí entra en la ponderación
      if (estadoMed === 'CERO_MEDIDO') {
        valorLeyDec = new Decimal(0);
      }

      const claveCompatible = `${ley.codigoLey}__${ley.simbolo}__${ley.unidadMedida}`;
      if (leyesVistasEnLote.has(claveCompatible)) {
        errores.push(`El lote ${lote.numeroLote} tiene análisis duplicados para ${ley.nombreLey} (${ley.unidadMedida}).`);
        continue;
      }
      leyesVistasEnLote.add(claveCompatible);

      const actual = mapaLeyes.get(claveCompatible) || {
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
        pesoBasePonderacionKg.mul(valorLeyDec)
      );
      actual.sumaPesoConEstaLeyKg = actual.sumaPesoConEstaLeyKg.add(pesoBasePonderacionKg);
      actual.lotesIncluidos += 1;

      mapaLeyes.set(claveCompatible, actual);
    }
  }

  if (tiposMineralSet.size > 1) {
    advertencias.push(
      `Atención: Se están agrupando lotes de distintos tipos de material (${Array.from(tiposMineralSet).join(', ')}).`
    );
  }

  const promediosLeyes: PromedioLeyResultado[] = [];
  const totalLotes = lotes.length;

  for (const [, item] of mapaLeyes.entries()) {
    if (item.sumaPesoConEstaLeyKg.gt(0)) {
      const promedioExacto = item.sumaProductoPesoPorLey.div(item.sumaPesoConEstaLeyKg);
      const lotesConFaltante = totalLotes - item.lotesIncluidos;
      const coberturaPct = new Decimal(item.lotesIncluidos)
        .div(totalLotes)
        .mul(100)
        .toFixed(2);

      const { valorFino, unidadFino } = calcularContenidoFino(
        item.sumaPesoConEstaLeyKg,
        promedioExacto,
        item.unidadMedida
      );

      if (lotesConFaltante > 0) {
        advertencias.push(
          `Cobertura parcial en ${item.nombreLey} (${item.unidadMedida}): medido en ${item.lotesIncluidos}/${totalLotes} lotes (${coberturaPct}%). Los ${lotesConFaltante} lote(s) restantes no se asumen como cero.`
        );
      }

      promediosLeyes.push({
        codigoLey: item.codigoLey,
        mineral: item.mineral,
        simbolo: item.simbolo,
        nombreLey: item.nombreLey,
        unidadMedida: item.unidadMedida,
        leyPromedio: promedioExacto.toFixed(4),
        leyPromedioRedondeada: promedioExacto.toFixed(2),
        pesoBasePonderadoKg: item.sumaPesoConEstaLeyKg.toFixed(4),
        contenidoFino: valorFino.toFixed(4),
        unidadFino,
        lotesIncluidos: item.lotesIncluidos,
        lotesConFaltante,
        coberturaPct,
        advertenciaFaltantes: lotesConFaltante > 0,
      });
    }
  }

  const pesoPrincipalKg = usarPesoSecoSiExiste ? sumaPesoTotalSecoKg : sumaPesoTotalHumedoKg;

  return {
    totalLotes,
    totalSacos,
    pesoTotalKg: pesoPrincipalKg.toFixed(4),
    pesoTotalTm: pesoPrincipalKg.div(1000).toFixed(4),
    pesoTotalSecoKg: sumaPesoTotalSecoKg.toFixed(4),
    pesoTotalSecoTm: sumaPesoTotalSecoKg.div(1000).toFixed(4),
    criterioPeso: usarPesoSecoSiExiste ? 'PESO_SECO_CONVERTIDO_KG' : 'PESO_NETO_CONVERTIDO_KG',
    promediosLeyes,
    advertencias,
    errores,
    esValido: errores.length === 0,
  };
}
