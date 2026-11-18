import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  COTIZACIONES_OFICIALES_FALLBACK,
  CotizacionReferencia,
  TIPO_CAMBIO_OFICIAL_BOB,
  LoteItem,
  calcularValorizacionGrupo,
  calcularValorizacionLote,
  formatearEnteroBolivia,
  formatearFechaBolivia,
  formatearMonedaBob,
  formatearMonedaUsd,
  formatearNumeroBolivia,
} from './calculations';

// Paleta corporativa MineralFlow para documentos PDF
const COLOR_HEADER_BG: [number, number, number] = [8, 22, 34]; // #081622
const COLOR_CYAN: [number, number, number] = [8, 145, 178]; // #0891B2
const COLOR_EMERALD: [number, number, number] = [5, 150, 105]; // #059669
const COLOR_TEXTO_OSCURO: [number, number, number] = [15, 23, 42];
const COLOR_TEXTO_GRIS: [number, number, number] = [100, 116, 139];

function descargarCSV(nombreArchivo: string, filas: string[][]) {
  const csvContent =
    '\uFEFF' +
    filas
      .map((row) =>
        row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

function dibujarMembretePDF(doc: jsPDF, titulo: string, subtitulo: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLOR_HEADER_BG);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(...COLOR_CYAN);
  doc.rect(0, 26, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MINERALFLOW BOLIVIA', 14, 11);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(subtitulo, 14, 17);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 211, 238);
  doc.text(titulo, pageWidth - 14, 12, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(`Emitido: ${new Date().toLocaleString('es-BO')}  |  TC BCB: ${TIPO_CAMBIO_OFICIAL_BOB} Bs/$US`, pageWidth - 14, 19, { align: 'right' });

  doc.setTextColor(...COLOR_TEXTO_OSCURO);
}

function agregarPieDePaginaPDF(doc: jsPDF) {
  const totalPages = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_TEXTO_GRIS);
    doc.text(
      'MineralFlow Bolivia — Reporte Comercial y Valorización Referencial SENARECOM (Ley 535)',
      14,
      pageHeight - 7
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
}

function dibujarBloqueFirmasPDF(doc: jsPDF, yStart: number, izquierda: string, derecha: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = yStart + 14;
  if (y + 22 > pageHeight - 15) {
    doc.addPage();
    y = 26;
  }
  doc.setDrawColor(100, 116, 139);
  doc.line(24, y, 104, y);
  doc.line(pageWidth - 104, y, pageWidth - 24, y);
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_TEXTO_OSCURO);
  doc.text(izquierda, 64, y + 5, { align: 'center' });
  doc.text(derecha, pageWidth - 64, y + 5, { align: 'center' });
}

export function exportarLiquidacionVentaExcel(
  venta: any,
  cotizaciones: CotizacionReferencia[] = COTIZACIONES_OFICIALES_FALLBACK
) {
  const valGrupo = calcularValorizacionGrupo(venta.detalles || [], cotizaciones);
  const filas: string[][] = [
    ['MINERALFLOW BOLIVIA — LIQUIDACION DETALLADA DE VENTA MINERA'],
    ['Nro Venta', venta.numeroVenta, 'Fecha', formatearFechaBolivia(venta.fecha)],
    ['Comprador', venta.compradorNombre, 'NIT / ID', venta.compradorNit || '-'],
    ['Expediente M-02', venta.expedienteM02 || '-', 'Responsable', venta.usuarioNombre || '-'],
    ['Observaciones', venta.observaciones || '-', 'Tipo Cambio', `${TIPO_CAMBIO_OFICIAL_BOB} Bs/$US`],
    [],
    ['RESUMEN FINANCIERO Y OPERATIVO DE LA VENTA'],
    ['Total Lotes', String(venta.totalLotes), 'Total Sacos', String(venta.totalSacos)],
    ['Peso Total (kg)', formatearNumeroBolivia(venta.pesoTotalKg, 2), 'Peso Promedio por Saco (kg)', formatearNumeroBolivia(valGrupo.pesoPromedioPorSacoKg, 2)],
    ['Valor Bruto ($US)', formatearNumeroBolivia(valGrupo.valorBrutoTotalUsd, 2), 'Valor Bruto (Bs)', formatearNumeroBolivia(valGrupo.valorBrutoTotalBob, 2)],
    ['Regalia Minera Ley 535 ($US)', formatearNumeroBolivia(valGrupo.regaliaTotalUsd, 2), 'Regalia Minera (Bs)', formatearNumeroBolivia(valGrupo.regaliaTotalBob, 2)],
    ['LIQUIDO A RECIBIR ($US)', formatearNumeroBolivia(valGrupo.valorNetoTotalUsd, 2), 'LIQUIDO A RECIBIR (Bs)', formatearNumeroBolivia(valGrupo.valorNetoTotalBob, 2)],
    ['Valor Promedio por Saco (Bs)', formatearNumeroBolivia(valGrupo.valorPromedioPorSacoBob, 2), 'Valor Promedio por Lote (Bs)', formatearNumeroBolivia(valGrupo.valorPromedioPorLoteBob, 2)],
    [],
    ['PROMEDIOS PONDERADOS DE LEYES'],
    ['Simbolo', 'Ley Mineral', 'Promedio Ponderado', 'Unidad', 'Lotes Incluidos'],
    ...(venta.resumenLeyes || []).map((rl: any) => [
      rl.simbolo,
      rl.nombreLey,
      rl.leyPromedioStr,
      rl.unidadMedida,
      String(rl.lotesIncluidos),
    ]),
    [],
    ['DESGLOSE VALORIZADO POR MINERAL'],
    ['Mineral', 'Simbolo', 'Unidades Pagables', 'Unidad Cot.', 'Precio ($US)', 'Bruto (Bs)', 'Regalia (%)', 'Regalia (Bs)', 'Neto a Recibir (Bs)'],
    ...valGrupo.desglosePorMineral.map((m) => [
      m.mineral,
      m.simbolo,
      formatearNumeroBolivia(m.cantidadUnidadesPagables, 3),
      m.unidadCotizacion,
      formatearNumeroBolivia(m.precioUsd, 2),
      formatearNumeroBolivia(m.valorBrutoBob, 2),
      `${formatearNumeroBolivia(m.alicuotaRegalia, 1)}%`,
      formatearNumeroBolivia(m.regaliaBob, 2),
      formatearNumeroBolivia(m.valorNetoBob, 2),
    ]),
    [],
    ['DETALLE DE LOTES Y VALOR POR SACO'],
    ['Nro Lote', 'Fecha Compra', 'Proveedor Original', 'Mina Origen', 'Mineral', 'Sacos', 'kg/Saco', 'Peso', 'Unidad', 'Leyes Individuales', 'Valor Lote (Bs)', 'Valor por Saco (Bs)', 'Valor Lote ($US)'],
    ...(venta.detalles || []).map((d: any) => {
      const vl = calcularValorizacionLote(d, cotizaciones);
      return [
        d.numeroLote,
        formatearFechaBolivia(d.fechaCompra),
        d.proveedorNombre,
        d.minaOrigen || '-',
        d.tipoMineral,
        String(d.sacosRegistrados),
        formatearNumeroBolivia(vl.pesoPorSacoKg, 2),
        d.pesoRegistradoStr || formatearNumeroBolivia(d.pesoRegistrado, 2),
        d.unidadPesoRegistrada,
        (d.leyesSnapshot || []).map((l: any) => `${l.simbolo}: ${l.valorStr} ${l.unidadMedida}`).join(' | '),
        formatearNumeroBolivia(vl.valorNetoBob, 2),
        formatearNumeroBolivia(vl.valorPorSacoBob, 2),
        formatearNumeroBolivia(vl.valorNetoUsd, 2),
      ];
    }),
  ];

  descargarCSV(`liquidacion_${venta.numeroVenta}.csv`, filas);
}

export function exportarHistorialVentasExcel(
  ventas: any[],
  cotizaciones: CotizacionReferencia[] = COTIZACIONES_OFICIALES_FALLBACK
) {
  let sumaLotes = 0;
  let sumaSacos = 0;
  let sumaPeso = 0;
  let sumaNetoBob = 0;
  let sumaNetoUsd = 0;

  const cuerpo = ventas.map((v) => {
    const val = calcularValorizacionGrupo(v.detalles || [], cotizaciones);
    sumaLotes += Number(v.totalLotes || 0);
    sumaSacos += Number(v.totalSacos || 0);
    sumaPeso += Number(v.pesoTotalKg || 0);
    sumaNetoBob += val.valorNetoTotalBob;
    sumaNetoUsd += val.valorNetoTotalUsd;

    return [
      v.numeroVenta,
      formatearFechaBolivia(v.fecha),
      v.compradorNombre,
      v.compradorNit || '-',
      String(v.totalLotes),
      String(v.totalSacos),
      formatearNumeroBolivia(val.pesoPromedioPorSacoKg, 2),
      v.pesoTotalKgStr || formatearNumeroBolivia(v.pesoTotalKg, 2),
      (v.resumenLeyes || []).map((r: any) => `${r.simbolo}: ${r.leyPromedioStr} ${r.unidadMedida}`).join(' | '),
      formatearNumeroBolivia(val.valorPromedioPorSacoBob, 2),
      formatearNumeroBolivia(val.valorNetoTotalBob, 2),
      formatearNumeroBolivia(val.valorNetoTotalUsd, 2),
      v.usuarioNombre || '-',
    ];
  });

  const filas: string[][] = [
    ['MINERALFLOW BOLIVIA — REPORTE GENERAL DE VENTAS VALORIZADAS'],
    ['Fecha Emision', new Date().toLocaleString('es-BO'), 'Tipo de Cambio', `${TIPO_CAMBIO_OFICIAL_BOB} Bs/$US`],
    [],
    ['Nro Venta', 'Fecha', 'Comprador', 'NIT', 'Lotes', 'Sacos', 'kg/Saco', 'Peso Total (kg)', 'Leyes Promedio', 'Bs/Saco Prom.', 'Total a Recibir (Bs)', 'Total ($US)', 'Responsable'],
    ...cuerpo,
    [],
    ['TOTALES', '', `${ventas.length} ventas`, '', String(sumaLotes), String(sumaSacos), sumaSacos > 0 ? formatearNumeroBolivia(sumaPeso / sumaSacos, 2) : '0,00', formatearNumeroBolivia(sumaPeso, 2), '', sumaSacos > 0 ? formatearNumeroBolivia(sumaNetoBob / sumaSacos, 2) : '0,00', formatearNumeroBolivia(sumaNetoBob, 2), formatearNumeroBolivia(sumaNetoUsd, 2), ''],
  ];

  descargarCSV('mineralflow_historial_ventas.csv', filas);
}

export function exportarLiquidacionVentaPDF(
  venta: any,
  cotizaciones: CotizacionReferencia[] = COTIZACIONES_OFICIALES_FALLBACK
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const valGrupo = calcularValorizacionGrupo(venta.detalles || [], cotizaciones);

  dibujarMembretePDF(
    doc,
    `LIQUIDACIÓN ${venta.numeroVenta}`,
    'Comprobante Oficial Interno de Comercialización y Valorización de Lotes'
  );

  autoTable(doc, {
    startY: 32,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    body: [
      [
        `Comprador: ${venta.compradorNombre}`,
        `NIT / ID: ${venta.compradorNit || 'S/NIT'}`,
        `Fecha Venta: ${formatearFechaBolivia(venta.fecha)}`,
        `Exp. M-02: ${venta.expedienteM02 || 'PENDIENTE'}`,
      ],
      [
        `Total Lotes: ${venta.totalLotes} lotes`,
        `Total Sacos: ${formatearEnteroBolivia(venta.totalSacos)} sacos (${formatearNumeroBolivia(valGrupo.pesoPromedioPorSacoKg, 1)} kg/saco)`,
        `Peso Neto: ${formatearNumeroBolivia(venta.pesoTotalKg, 2)} kg`,
        `Responsable: ${venta.usuarioNombre || '-'}`,
      ],
    ],
  });

  const yAfterInfo = (doc as any).lastAutoTable.finalY + 4;

  // Bloque financiero destacado en Bolivianos (Bs)
  autoTable(doc, {
    startY: yAfterInfo,
    head: [[
      'Valor Bruto ($US)',
      'Valor Bruto (Bs)',
      'Regalía Ley 535 (Bs)',
      'Líquido a Recibir ($US)',
      'LÍQUIDO A RECIBIR (Bs)',
      'Valor por Saco (Bs)',
      'Valor por Lote (Bs)',
    ]],
    body: [[
      formatearMonedaUsd(valGrupo.valorBrutoTotalUsd),
      formatearMonedaBob(valGrupo.valorBrutoTotalBob),
      formatearMonedaBob(valGrupo.regaliaTotalBob),
      formatearMonedaUsd(valGrupo.valorNetoTotalUsd),
      formatearMonedaBob(valGrupo.valorNetoTotalBob),
      formatearMonedaBob(valGrupo.valorPromedioPorSacoBob),
      formatearMonedaBob(valGrupo.valorPromedioPorLoteBob),
    ]],
    headStyles: { fillColor: COLOR_EMERALD, textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 9.5, fontStyle: 'bold', textColor: [6, 78, 59], fillColor: [236, 253, 245] },
  });

  const yAfterFin = (doc as any).lastAutoTable.finalY + 5;
  const leyesTexto = (venta.resumenLeyes || [])
    .map((r: any) => `${r.nombreLey}: ${r.leyPromedioStr} ${r.unidadMedida}`)
    .join('   |   ');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Leyes Promedio Ponderadas: ${leyesTexto || 'Sin leyes registradas'}`, 14, yAfterFin);

  autoTable(doc, {
    startY: yAfterFin + 4,
    head: [[
      'N.º Lote',
      'Proveedor / Mina',
      'Mineral',
      'Sacos',
      'kg / Saco',
      'Peso',
      'Leyes Individuales',
      'Valor Lote (Bs)',
      'Valor / Saco (Bs)',
    ]],
    body: (venta.detalles || []).map((d: any) => {
      const vl = calcularValorizacionLote(d, cotizaciones);
      return [
        d.numeroLote,
        `${d.proveedorNombre}${d.minaOrigen ? ` (${d.minaOrigen})` : ''}`,
        d.tipoMineral,
        String(d.sacosRegistrados),
        `${formatearNumeroBolivia(vl.pesoPorSacoKg, 1)} kg`,
        `${formatearNumeroBolivia(d.pesoRegistrado, 2)} ${d.unidadPesoRegistrada}`,
        (d.leyesSnapshot || []).map((l: any) => `${l.simbolo}: ${l.valorStr} ${l.unidadMedida}`).join(', '),
        formatearMonedaBob(vl.valorNetoBob),
        formatearMonedaBob(vl.valorPorSacoBob),
      ];
    }),
    headStyles: { fillColor: COLOR_HEADER_BG, textColor: 255, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
      8: { halign: 'right', fontStyle: 'bold' },
    },
  });

  dibujarBloqueFirmasPDF(
    doc,
    (doc as any).lastAutoTable.finalY,
    `Entregado por: ${venta.usuarioNombre || 'Comercializadora MineralFlow'}`,
    `Recibido / Conforme: ${venta.compradorNombre}`
  );
  agregarPieDePaginaPDF(doc);
  doc.save(`Liquidacion_${venta.numeroVenta}.pdf`);
}

export function exportarHistorialVentasPDF(
  ventas: any[],
  cotizaciones: CotizacionReferencia[] = COTIZACIONES_OFICIALES_FALLBACK
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  dibujarMembretePDF(doc, 'REPORTE DE VENTAS', 'Resumen Consolidado de Ventas y Liquidaciones en Bolivianos');

  let totalLotes = 0;
  let totalSacos = 0;
  let totalPeso = 0;
  let totalBob = 0;
  let totalUsd = 0;

  const filas = ventas.map((v) => {
    const val = calcularValorizacionGrupo(v.detalles || [], cotizaciones);
    totalLotes += Number(v.totalLotes || 0);
    totalSacos += Number(v.totalSacos || 0);
    totalPeso += Number(v.pesoTotalKg || 0);
    totalBob += val.valorNetoTotalBob;
    totalUsd += val.valorNetoTotalUsd;

    return [
      v.numeroVenta,
      formatearFechaBolivia(v.fecha),
      v.compradorNombre,
      String(v.totalLotes),
      `${formatearEnteroBolivia(v.totalSacos)} (${formatearNumeroBolivia(val.pesoPromedioPorSacoKg, 1)} kg/u)`,
      `${formatearNumeroBolivia(v.pesoTotalKg, 2)} kg`,
      (v.resumenLeyes || []).map((r: any) => `${r.simbolo}: ${r.leyPromedioStr}`).join(', '),
      formatearMonedaBob(val.valorPromedioPorSacoBob),
      formatearMonedaBob(val.valorNetoTotalBob),
      formatearMonedaUsd(val.valorNetoTotalUsd),
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [[
      'N.º Venta',
      'Fecha',
      'Comprador',
      'Lotes',
      'Sacos (kg/saco)',
      'Peso Total',
      'Leyes Prom.',
      'Bs / Saco',
      'Total a Recibir (Bs)',
      'Total ($US)',
    ]],
    body: [
      ...filas,
      [
        'TOTALES',
        `${ventas.length} op.`,
        '',
        String(totalLotes),
        formatearEnteroBolivia(totalSacos),
        `${formatearNumeroBolivia(totalPeso, 2)} kg`,
        '',
        totalSacos > 0 ? formatearMonedaBob(totalBob / totalSacos) : 'Bs 0,00',
        formatearMonedaBob(totalBob),
        formatearMonedaUsd(totalUsd),
      ],
    ],
    headStyles: { fillColor: COLOR_HEADER_BG, textColor: 255, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2.2 },
    didParseCell: (data) => {
      if (data.row.index === filas.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [236, 253, 245];
      }
    },
  });

  agregarPieDePaginaPDF(doc);
  doc.save('MineralFlow_Reporte_Ventas.pdf');
}

export function exportarInventarioAlmacenPDF(
  lotes: LoteItem[],
  cotizaciones: CotizacionReferencia[] = COTIZACIONES_OFICIALES_FALLBACK,
  tituloFiltro: string = 'INVENTARIO DE ALMACÉN'
) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const valGrupo = calcularValorizacionGrupo(lotes, cotizaciones);

  dibujarMembretePDF(doc, tituloFiltro, `Detalle de Lotes, Sacos y Valorización Estimada (${lotes.length} lotes)`);

  autoTable(doc, {
    startY: 32,
    head: [[
      'Total Lotes',
      'Total Sacos',
      'Peso Promedio / Saco',
      'Peso Neto Total',
      'Valor Estimado (Bs)',
      'Valor Estimado ($US)',
      'Valor Promedio / Saco',
    ]],
    body: [[
      `${lotes.length} lotes`,
      `${formatearEnteroBolivia(valGrupo.totalSacos)} sacos`,
      `${formatearNumeroBolivia(valGrupo.pesoPromedioPorSacoKg, 2)} kg/saco`,
      `${formatearNumeroBolivia(valGrupo.pesoTotalKg, 2)} kg`,
      formatearMonedaBob(valGrupo.valorNetoTotalBob),
      formatearMonedaUsd(valGrupo.valorNetoTotalUsd),
      formatearMonedaBob(valGrupo.valorPromedioPorSacoBob),
    ]],
    headStyles: { fillColor: COLOR_CYAN, textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 9, fontStyle: 'bold', fillColor: [240, 249, 255] },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [[
      'N.º Lote',
      'Fecha',
      'Proveedor / Mina',
      'Zona',
      'Mineral',
      'Sacos',
      'kg/Saco',
      'Peso Neto',
      'Leyes',
      'Valor Lote (Bs)',
      'Bs / Saco',
      'Estado',
    ]],
    body: lotes.map((l) => {
      const vl = calcularValorizacionLote(l, cotizaciones);
      return [
        l.numeroLote,
        formatearFechaBolivia(l.fechaCompra),
        `${l.proveedorNombre}${l.minaOrigen ? ` (${l.minaOrigen})` : ''}`,
        l.ubicacionCodigo || 'S/Z',
        l.tipoMineral,
        String(l.cantidadSacos),
        `${formatearNumeroBolivia(vl.pesoPorSacoKg, 1)} kg`,
        `${formatearNumeroBolivia(l.pesoNeto, 2)} ${l.unidadPeso}`,
        l.leyes.map((x) => `${x.simbolo}:${x.valorStr}`).join(' '),
        formatearMonedaBob(vl.valorNetoBob),
        formatearMonedaBob(vl.valorPorSacoBob),
        l.estado,
      ];
    }),
    headStyles: { fillColor: COLOR_HEADER_BG, textColor: 255, fontSize: 7.5 },
    styles: { fontSize: 7.2, cellPadding: 1.8 },
    columnStyles: {
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      9: { halign: 'right', fontStyle: 'bold' },
      10: { halign: 'right', fontStyle: 'bold' },
    },
  });

  agregarPieDePaginaPDF(doc);
  doc.save(`MineralFlow_Inventario_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export interface DatosReporteGeneral {
  lotes: LoteItem[];
  ventas: any[];
  estadisticasMinerales: Array<{
    mineral: string;
    lotesDisponibles: number;
    lotesVendidos: number;
    totalSacos: number;
    pesoTotalKg: number;
    pesoPorSacoKg: number;
    valorNetoBob: number;
    valorNetoUsd: number;
    valorPorSacoBob: number;
  }>;
  estadisticasProveedores: Array<{
    proveedor: string;
    totalLotes: number;
    disponibles: number;
    vendidos: number;
    totalSacos: number;
    pesoTotalKg: number;
    valorNetoBob: number;
  }>;
  cotizaciones: CotizacionReferencia[];
}

export function exportarReporteGeneralExcel(datos: DatosReporteGeneral) {
  const lotesDisp = datos.lotes.filter((l) => l.estado === 'DISPONIBLE');
  const valDisp = calcularValorizacionGrupo(lotesDisp, datos.cotizaciones);
  const valTotal = calcularValorizacionGrupo(datos.lotes, datos.cotizaciones);

  const filas: string[][] = [
    ['MINERALFLOW BOLIVIA — REPORTE GENERAL Y ESTADISTICAS DE LOTES, SACOS Y VENTAS'],
    ['Generado en', new Date().toLocaleString('es-BO'), 'Tipo de Cambio', `${TIPO_CAMBIO_OFICIAL_BOB} Bs/$US`],
    [],
    ['RESUMEN EJECUTIVO'],
    ['Total Lotes Analizados', String(datos.lotes.length), 'Lotes Disponibles', String(lotesDisp.length)],
    ['Total Sacos (Todos)', String(valTotal.totalSacos), 'Peso Promedio por Saco (kg)', formatearNumeroBolivia(valTotal.pesoPromedioPorSacoKg, 2)],
    ['Valor Stock Disponible (Bs)', formatearNumeroBolivia(valDisp.valorNetoTotalBob, 2), 'Valor Stock Disponible ($US)', formatearNumeroBolivia(valDisp.valorNetoTotalUsd, 2)],
    ['Valor Total Histórico Lotes (Bs)', formatearNumeroBolivia(valTotal.valorNetoTotalBob, 2), 'Promedio por Saco (Bs)', formatearNumeroBolivia(valTotal.valorPromedioPorSacoBob, 2)],
    [],
    ['ESTADISTICAS POR MINERAL'],
    ['Mineral', 'Disponibles', 'Vendidos', 'Total Sacos', 'Peso Total (kg)', 'kg/Saco', 'Valor Neto (Bs)', 'Valor ($US)', 'Bs/Saco'],
    ...datos.estadisticasMinerales.map((m) => [
      m.mineral,
      String(m.lotesDisponibles),
      String(m.lotesVendidos),
      String(m.totalSacos),
      formatearNumeroBolivia(m.pesoTotalKg, 2),
      formatearNumeroBolivia(m.pesoPorSacoKg, 2),
      formatearNumeroBolivia(m.valorNetoBob, 2),
      formatearNumeroBolivia(m.valorNetoUsd, 2),
      formatearNumeroBolivia(m.valorPorSacoBob, 2),
    ]),
    [],
    ['ESTADISTICAS POR PROVEEDOR'],
    ['Proveedor / Cooperativa', 'Total Lotes', 'Disponibles', 'Vendidos', 'Total Sacos', 'Peso Total (kg)', 'Valor Total (Bs)'],
    ...datos.estadisticasProveedores.map((p) => [
      p.proveedor,
      String(p.totalLotes),
      String(p.disponibles),
      String(p.vendidos),
      String(p.totalSacos),
      formatearNumeroBolivia(p.pesoTotalKg, 2),
      formatearNumeroBolivia(p.valorNetoBob, 2),
    ]),
    [],
    ['DETALLE DE TODOS LOS LOTES Y SACOS'],
    ['Nro Lote', 'Fecha', 'Estado', 'Proveedor', 'Mina', 'Mineral', 'Sacos', 'kg/Saco', 'Peso Neto', 'Unidad', 'Leyes', 'Valor Lote (Bs)', 'Bs/Saco', 'Valor ($US)'],
    ...datos.lotes.map((l) => {
      const vl = calcularValorizacionLote(l, datos.cotizaciones);
      return [
        l.numeroLote,
        formatearFechaBolivia(l.fechaCompra),
        l.estado,
        l.proveedorNombre,
        l.minaOrigen || '-',
        l.tipoMineral,
        String(l.cantidadSacos),
        formatearNumeroBolivia(vl.pesoPorSacoKg, 2),
        formatearNumeroBolivia(l.pesoNeto, 2),
        l.unidadPeso,
        l.leyes.map((x) => `${x.simbolo}: ${x.valorStr} ${x.unidadMedida}`).join(' | '),
        formatearNumeroBolivia(vl.valorNetoBob, 2),
        formatearNumeroBolivia(vl.valorPorSacoBob, 2),
        formatearNumeroBolivia(vl.valorNetoUsd, 2),
      ];
    }),
  ];

  descargarCSV(`MineralFlow_Reporte_General_${new Date().toISOString().slice(0, 10)}.csv`, filas);
}

export function exportarReporteGeneralPDF(datos: DatosReporteGeneral) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const lotesDisp = datos.lotes.filter((l) => l.estado === 'DISPONIBLE');
  const valDisp = calcularValorizacionGrupo(lotesDisp, datos.cotizaciones);
  const valTotal = calcularValorizacionGrupo(datos.lotes, datos.cotizaciones);

  dibujarMembretePDF(
    doc,
    'REPORTE GENERAL Y ESTADÍSTICAS',
    `Consolidado Operativo y Valorizado en Bolivianos (${datos.lotes.length} lotes · ${datos.ventas.length} ventas)`
  );

  autoTable(doc, {
    startY: 32,
    head: [[
      'Lotes Analizados',
      'Disponibles / Vendidos',
      'Total Sacos',
      'Peso Prom./Saco',
      'Valor Stock Disp. (Bs)',
      'Valor Histórico Total (Bs)',
      'Promedio / Saco (Bs)',
    ]],
    body: [[
      `${datos.lotes.length} lotes`,
      `${lotesDisp.length} disp. / ${datos.lotes.length - lotesDisp.length} vend.`,
      `${formatearEnteroBolivia(valTotal.totalSacos)} sacos`,
      `${formatearNumeroBolivia(valTotal.pesoPromedioPorSacoKg, 2)} kg`,
      formatearMonedaBob(valDisp.valorNetoTotalBob),
      formatearMonedaBob(valTotal.valorNetoTotalBob),
      formatearMonedaBob(valTotal.valorPromedioPorSacoBob),
    ]],
    headStyles: { fillColor: COLOR_EMERALD, textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 9, fontStyle: 'bold', fillColor: [236, 253, 245] },
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Estadísticas por Mineral', 14, (doc as any).lastAutoTable.finalY + 8);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 11,
    head: [['Mineral', 'Disp.', 'Vend.', 'Sacos', 'Peso Total (kg)', 'kg/Saco', 'Valor Neto (Bs)', 'Valor ($US)', 'Bs / Saco']],
    body: datos.estadisticasMinerales.map((m) => [
      m.mineral,
      String(m.lotesDisponibles),
      String(m.lotesVendidos),
      formatearEnteroBolivia(m.totalSacos),
      `${formatearNumeroBolivia(m.pesoTotalKg, 2)} kg`,
      `${formatearNumeroBolivia(m.pesoPorSacoKg, 2)} kg`,
      formatearMonedaBob(m.valorNetoBob),
      formatearMonedaUsd(m.valorNetoUsd),
      formatearMonedaBob(m.valorPorSacoBob),
    ]),
    headStyles: { fillColor: COLOR_CYAN, textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Estadísticas por Proveedor / Cooperativa', 14, (doc as any).lastAutoTable.finalY + 8);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 11,
    head: [['Proveedor / Cooperativa', 'Total Lotes', 'Disponibles', 'Vendidos', 'Total Sacos', 'Peso Total (kg)', 'Valor Total (Bs)']],
    body: datos.estadisticasProveedores.map((p) => [
      p.proveedor,
      String(p.totalLotes),
      String(p.disponibles),
      String(p.vendidos),
      formatearEnteroBolivia(p.totalSacos),
      `${formatearNumeroBolivia(p.pesoTotalKg, 2)} kg`,
      formatearMonedaBob(p.valorNetoBob),
    ]),
    headStyles: { fillColor: COLOR_HEADER_BG, textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  doc.addPage();
  dibujarMembretePDF(doc, 'DETALLE LOTE POR LOTE', 'Catálogo Completo con Sacos, Peso por Saco y Valorización en Bs');

  autoTable(doc, {
    startY: 32,
    head: [['N.º Lote', 'Fecha', 'Estado', 'Proveedor', 'Mineral', 'Sacos', 'kg/Saco', 'Peso Neto', 'Leyes', 'Valor Lote (Bs)', 'Bs/Saco']],
    body: datos.lotes.map((l) => {
      const vl = calcularValorizacionLote(l, datos.cotizaciones);
      return [
        l.numeroLote,
        formatearFechaBolivia(l.fechaCompra),
        l.estado,
        l.proveedorNombre,
        l.tipoMineral,
        String(l.cantidadSacos),
        `${formatearNumeroBolivia(vl.pesoPorSacoKg, 1)} kg`,
        `${formatearNumeroBolivia(l.pesoNeto, 2)} ${l.unidadPeso}`,
        l.leyes.map((x) => `${x.simbolo}:${x.valorStr}`).join(' '),
        formatearMonedaBob(vl.valorNetoBob),
        formatearMonedaBob(vl.valorPorSacoBob),
      ];
    }),
    headStyles: { fillColor: COLOR_HEADER_BG, textColor: 255, fontSize: 7.5 },
    styles: { fontSize: 7.2, cellPadding: 1.8 },
  });

  agregarPieDePaginaPDF(doc);
  doc.save(`MineralFlow_Reporte_General_${new Date().toISOString().slice(0, 10)}.pdf`);
}
