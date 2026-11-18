import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Eye,
  FileDown,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  X,
  CheckCircle2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiFetch } from '../utils/api';
import {
  formatearEnteroBolivia,
  formatearFechaBolivia,
  formatearNumeroBolivia,
} from '../utils/calculations';
import { EmptyStateMineralSvg } from '../components/MineralGraphics';

export function HistorialVentasPage() {
  const [ventas, setVentas] = useState<any[]>([]);
  const [compradores, setCompradores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [q, setQ] = useState('');
  const [compradorId, setCompradorId] = useState('');
  const [numeroLote, setNumeroLote] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // Venta seleccionada para ver detalle o imprimir
  const [ventaSeleccionada, setVentaSeleccionada] = useState<any | null>(null);

  const cargarVentas = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (compradorId) params.set('compradorId', compradorId);
      if (numeroLote.trim()) params.set('numeroLote', numeroLote.trim());
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);

      const [resVentas, resComp] = await Promise.all([
        apiFetch<{ ventas: any[] }>(`/api/ventas?${params.toString()}`),
        apiFetch<{ compradores: any[] }>('/api/compradores'),
      ]);

      setVentas(resVentas.ventas);
      setCompradores(resComp.compradores);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, [q, compradorId, numeroLote, desde, hasta]);

  const limpiarFiltros = () => {
    setQ('');
    setCompradorId('');
    setNumeroLote('');
    setDesde('');
    setHasta('');
  };

  // Exportar lista general o venta individual a CSV compatible con Excel
  const exportarCSV = (ventaEspecifica?: any) => {
    let filas: string[][] = [];
    let nombreArchivo = 'mineralflow_historial_ventas.csv';

    if (ventaEspecifica) {
      nombreArchivo = `liquidacion_${ventaEspecifica.numeroVenta}.csv`;
      filas = [
        ['LIQUIDACION DE VENTA MINERA — MINERALFLOW BOLIVIA'],
        ['Nro Venta', ventaEspecifica.numeroVenta],
        ['Fecha', formatearFechaBolivia(ventaEspecifica.fecha)],
        ['Comprador', ventaEspecifica.compradorNombre],
        ['NIT / Identificacion', ventaEspecifica.compradorNit || '-'],
        ['Responsable', ventaEspecifica.usuarioNombre],
        ['Total Lotes', String(ventaEspecifica.totalLotes)],
        ['Total Sacos', String(ventaEspecifica.totalSacos)],
        ['Peso Total (kg)', String(ventaEspecifica.pesoTotalKg)],
        [],
        ['PROMEDIOS PONDERADOS DE LEYES'],
        ['Simbolo', 'Ley Mineral', 'Promedio Ponderado', 'Unidad', 'Lotes Incluidos'],
        ...ventaEspecifica.resumenLeyes.map((rl: any) => [
          rl.simbolo,
          rl.nombreLey,
          rl.leyPromedioStr,
          rl.unidadMedida,
          String(rl.lotesIncluidos),
        ]),
        [],
        ['DETALLE HISTORICO DE LOTES VENDIDOS'],
        ['Nro Lote', 'Fecha Compra', 'Proveedor Original', 'Mina Origen', 'Mineral', 'Sacos', 'Peso', 'Unidad', 'Leyes Individuales'],
        ...ventaEspecifica.detalles.map((d: any) => [
          d.numeroLote,
          formatearFechaBolivia(d.fechaCompra),
          d.proveedorNombre,
          d.minaOrigen || '-',
          d.tipoMineral,
          String(d.sacosRegistrados),
          d.pesoRegistradoStr,
          d.unidadPesoRegistrada,
          (d.leyesSnapshot || [])
            .map((l: any) => `${l.simbolo}: ${l.valorStr} ${l.unidadMedida}`)
            .join(' | '),
        ]),
      ];
    } else {
      filas = [
        [
          'Nro Venta',
          'Fecha',
          'Comprador',
          'NIT',
          'Cantidad Lotes',
          'Total Sacos',
          'Peso Total (kg)',
          'Leyes Promedio',
          'Usuario Responsable',
        ],
        ...ventas.map((v) => [
          v.numeroVenta,
          formatearFechaBolivia(v.fecha),
          v.compradorNombre,
          v.compradorNit || '-',
          String(v.totalLotes),
          String(v.totalSacos),
          v.pesoTotalKgStr,
          v.resumenLeyes
            .map((r: any) => `${r.simbolo}: ${r.leyPromedioStr} ${r.unidadMedida}`)
            .join(' | '),
          v.usuarioNombre,
        ]),
      ];
    }

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
  };

  // Exportar a PDF real con jsPDF y autoTable
  const exportarPDF = (ventaEspecifica?: any) => {
    const doc = new jsPDF({ orientation: 'landscape' });

    if (ventaEspecifica) {
      doc.setFontSize(16);
      doc.text(
        `MineralFlow Bolivia — Liquidación de Venta ${ventaEspecifica.numeroVenta}`,
        14,
        16
      );
      doc.setFontSize(10);
      doc.text(
        `Fecha: ${formatearFechaBolivia(ventaEspecifica.fecha)}   |   Comprador: ${ventaEspecifica.compradorNombre
        } (${ventaEspecifica.compradorNit || 'S/NIT'})   |   Responsable: ${ventaEspecifica.usuarioNombre
        }`,
        14,
        24
      );
      doc.text(
        `Resumen: ${ventaEspecifica.totalLotes} Lotes   |   ${formatearEnteroBolivia(
          ventaEspecifica.totalSacos
        )} Sacos   |   Peso Neto Total: ${formatearNumeroBolivia(
          ventaEspecifica.pesoTotalKg,
          2
        )} kg`,
        14,
        30
      );

      const leyesTexto = ventaEspecifica.resumenLeyes
        .map((r: any) => `${r.nombreLey}: ${r.leyPromedioStr} ${r.unidadMedida}`)
        .join('   |   ');
      doc.text(`Leyes Promedio Ponderadas: ${leyesTexto}`, 14, 36);

      autoTable(doc, {
        startY: 42,
        head: [
          [
            'N.º Lote',
            'Fecha Compra',
            'Proveedor Original',
            'Mina Origen',
            'Mineral',
            'Sacos',
            'Peso',
            'Leyes Individuales',
          ],
        ],
        body: ventaEspecifica.detalles.map((d: any) => [
          d.numeroLote,
          formatearFechaBolivia(d.fechaCompra),
          d.proveedorNombre,
          d.minaOrigen || '-',
          d.tipoMineral,
          String(d.sacosRegistrados),
          `${formatearNumeroBolivia(d.pesoRegistrado, 2)} ${d.unidadPesoRegistrada}`,
          (d.leyesSnapshot || [])
            .map((l: any) => `${l.simbolo}: ${l.valorStr} ${l.unidadMedida}`)
            .join(', '),
        ]),
        headStyles: { fillColor: [30, 77, 59] },
        styles: { fontSize: 8 },
      });

      doc.save(`Reporte_${ventaEspecifica.numeroVenta}.pdf`);
    } else {
      doc.setFontSize(15);
      doc.text('MineralFlow Bolivia — Reporte General de Ventas de Minerales', 14, 16);
      autoTable(doc, {
        startY: 24,
        head: [
          [
            'N.º Venta',
            'Fecha',
            'Comprador',
            'Lotes',
            'Sacos',
            'Peso Total (kg)',
            'Leyes Promedio Ponderadas',
            'Responsable',
          ],
        ],
        body: ventas.map((v) => [
          v.numeroVenta,
          formatearFechaBolivia(v.fecha),
          v.compradorNombre,
          String(v.totalLotes),
          String(v.totalSacos),
          `${formatearNumeroBolivia(v.pesoTotalKg, 2)} kg`,
          v.resumenLeyes
            .map((r: any) => `${r.simbolo}: ${r.leyPromedioStr} ${r.unidadMedida}`)
            .join(', '),
          v.usuarioNombre,
        ]),
        headStyles: { fillColor: [30, 77, 59] },
        styles: { fontSize: 8 },
      });

      doc.save('MineralFlow_Historial_Ventas.pdf');
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Módulo 7 */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-3xl text-slate-900 dark:text-[#F8FAFC] mt-0.5">
            Ventas Realizadas
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => exportarPDF()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] dark:bg-[#06B6D4] dark:hover:bg-[#0891B2] text-white dark:text-[#060D14] text-xs font-bold transition"
          >
            <FileDown className="w-4 h-4 text-amber-300 dark:text-[#060D14]" />
            <span>Exportar Todo a PDF</span>
          </button>

          <button
            onClick={() => exportarCSV()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0F2232] dark:hover:bg-[#162E44] text-slate-900 dark:text-[#F8FAFC] border border-[#0891B2]/40 dark:border-[#1A364E] text-xs font-bold transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0891B2] dark:text-[#06B6D4]" />
            <span>Exportar Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* Herramientas de Consulta y Filtrado */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end no-print">
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
            Buscar Venta o Comprador
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej. VTA-2026-0001, Andina..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#1A364E] rounded-xl focus:outline-hidden focus:border-[#06B6D4]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
            Filtrar por Comprador
          </label>
          <select
            value={compradorId}
            onChange={(e) => setCompradorId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#1A364E] rounded-xl focus:outline-hidden"
          >
            <option value="">Todos los compradores</option>
            {compradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
            Buscar por N.º de Lote
          </label>
          <input
            type="text"
            value={numeroLote}
            onChange={(e) => setNumeroLote(e.target.value)}
            placeholder="Ej. LT-2026-0001"
            className="w-full px-3 py-2 text-xs font-mono-num bg-slate-50 dark:bg-[#060D14] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#1A364E] rounded-xl focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
            Desde Fecha
          </label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#1A364E] rounded-xl focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
              Hasta Fecha
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#1A364E] rounded-xl focus:outline-hidden"
            />
          </div>
          <button
            onClick={limpiarFiltros}
            title="Restaurar filtros"
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1A364E] text-slate-600 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-[#0F2232] mt-5"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabla Principal de Ventas */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl shadow-2xs overflow-hidden no-print">
        <div className="px-5 py-3 bg-slate-100 dark:bg-[#0F2232] border-b border-slate-200 dark:border-[#1A364E] flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600 dark:text-[#06B6D4]" />
            <span>Operaciones de venta registradas: {ventas.length}</span>
          </span>
        </div>

        {ventas.length === 0 && !cargando ? (
          <EmptyStateMineralSvg mensaje="No se encontraron ventas registradas con esos filtros" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1A364E] bg-slate-50 dark:bg-[#060D14] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                  <th className="py-3 px-4">N.º de Venta</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Comprador</th>
                  <th className="py-3 px-3 text-right">Cant. Lotes</th>
                  <th className="py-3 px-3 text-right">Total Sacos</th>
                  <th className="py-3 px-3 text-right">Peso Total</th>
                  <th className="py-3 px-3">Ley Promedio Ponderada</th>
                  <th className="py-3 px-3">Usuario Responsable</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1A364E]/70 dark:divide-[#1A364E] text-xs">
                {ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/50 transition">
                    <td className="py-3 px-4 font-mono-num font-bold text-amber-600 dark:text-[#06B6D4]">
                      {v.numeroVenta}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-[#94A3B8]">
                      {formatearFechaBolivia(v.fecha)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{v.compradorNombre}</div>
                      <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">{v.compradorNit}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {v.totalLotes}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      {formatearEnteroBolivia(v.totalSacos)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE]">
                      {formatearNumeroBolivia(v.pesoTotalKg, 2)} kg
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {v.resumenLeyes.map((rl: any) => (
                          <span
                            key={rl.codigoLey}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono-num font-bold bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE] border border-[#0891B2]/30 dark:border-[#06B6D4]/30"
                          >
                            {rl.simbolo}: {formatearNumeroBolivia(rl.leyPromedio, 2)}{' '}
                            {rl.unidadMedida}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-[#94A3B8]">{v.usuarioNombre}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setVentaSeleccionada(v)}
                          data-testid={`btn-detalle-venta-${v.numeroVenta}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#0891B2] dark:bg-[#06B6D4] text-white hover:bg-[#0e7490] dark:hover:bg-[#22D3EE] transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Abrir Venta</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle Completo de Venta + Impresión y Exportación Individual */}
      {ventaSeleccionada && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#0A1622] border-2 border-[#0891B2]/40 dark:border-[#06B6D4]/40 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Cabecera del modal */}
            <div className="px-6 py-4 bg-[#071320] dark:bg-[#060D14] text-white flex flex-wrap items-center justify-between gap-3 no-print">
              <div>
                <span className="text-[10px] font-mono-num uppercase tracking-widest text-amber-300">
                  EXPEDIENTE HISTÓRICO INMUTABLE DE VENTA
                </span>
                <h2 className="text-lg font-bold">
                  Operación {ventaSeleccionada.numeroVenta} — {ventaSeleccionada.compradorNombre}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportarPDF(ventaSeleccionada)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0891B2] dark:bg-[#06B6D4] text-white text-xs font-bold hover:bg-[#0e7490] dark:hover:bg-[#22D3EE]"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-300" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => exportarCSV(ventaSeleccionada)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0F2232] text-slate-900 dark:text-[#F8FAFC] text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#162E44]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#22D3EE]" />
                  <span>CSV / Excel</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 text-white text-xs font-bold hover:bg-white/25"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setVentaSeleccionada(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10"
                  aria-label="Cerrar detalle de venta"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido del Expediente */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* 1. Información General */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-[#060D14] p-4 rounded-xl border border-slate-200 dark:border-[#1A364E]">
                <div>
                  <span className="text-slate-500 dark:text-[#94A3B8] block">N.º de Operación</span>
                  <span className="font-mono-num font-bold text-sm text-amber-600 dark:text-amber-400">
                    {ventaSeleccionada.numeroVenta}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-[#94A3B8] block">Fecha de Venta</span>
                  <span className="font-bold">
                    {formatearFechaBolivia(ventaSeleccionada.fecha)}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 dark:text-[#94A3B8] block">Comprador (Snapshot Histórico)</span>
                  <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                    {ventaSeleccionada.compradorNombre}
                  </span>
                  <span className="block text-[11px] text-slate-600 dark:text-[#94A3B8]">
                    {ventaSeleccionada.compradorNit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-[#94A3B8] block">Estado / Responsable</span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#0891B2] dark:text-[#22D3EE]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {ventaSeleccionada.estado}
                  </span>
                  <span className="block text-[11px] text-slate-600 dark:text-[#94A3B8]">
                    {ventaSeleccionada.usuarioNombre}
                  </span>
                </div>
              </div>

              {/* 2. Resumen de Totales y Promedios Ponderados */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 grid grid-cols-3 gap-2.5">
                  <div className="bg-slate-100 dark:bg-[#0F2232] border border-slate-200 dark:border-[#1A364E] rounded-xl p-3.5">
                    <span className="text-slate-600 dark:text-[#94A3B8] font-bold block">Total Lotes</span>
                    <span className="text-2xl font-mono-num font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                      {ventaSeleccionada.totalLotes}
                    </span>
                  </div>
                  <div className="bg-slate-100 dark:bg-[#0F2232] border border-slate-200 dark:border-[#1A364E] rounded-xl p-3.5">
                    <span className="text-slate-600 dark:text-[#94A3B8] font-bold block">Sacos Totales</span>
                    <span className="text-2xl font-mono-num font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                      {formatearEnteroBolivia(ventaSeleccionada.totalSacos)}
                    </span>
                  </div>
                  <div className="bg-cyan-50 dark:bg-[#06B6D4]/15 border border-[#0891B2]/30 dark:border-[#06B6D4]/30 rounded-xl p-3.5">
                    <span className="text-[#0891B2] dark:text-[#22D3EE] font-bold block">Peso Total</span>
                    <span className="text-lg font-mono-num font-extrabold text-[#0891B2] dark:text-[#22D3EE]">
                      {formatearNumeroBolivia(ventaSeleccionada.pesoTotalKg, 2)} kg
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-slate-50 dark:bg-[#060D14] border border-[#0891B2]/40 dark:border-[#06B6D4]/40 rounded-xl p-3.5">
                  <span className="font-bold uppercase text-[#0891B2] dark:text-[#22D3EE] block mb-2">
                    Promedios Ponderados de Leyes al Confirmar la Venta
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ventaSeleccionada.resumenLeyes.map((rl: any) => (
                      <div
                        key={rl.codigoLey}
                        className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-lg p-2.5"
                      >
                        <div className="text-[11px] text-slate-600 dark:text-[#94A3B8]">{rl.nombreLey}</div>
                        <div className="text-base font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE]">
                          {formatearNumeroBolivia(rl.leyPromedio, 2)} {rl.unidadMedida}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-[#94A3B8]">
                          {rl.lotesIncluidos} lotes ponderados
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Detalle de Lotes Vendidos (Copia Histórica) */}
              <div>
                <h3 className="font-bold uppercase text-slate-900 dark:text-[#F8FAFC] mb-2.5">
                  Detalle de Lotes Vendidos ({ventaSeleccionada.detalles.length} Lotes)
                </h3>
                <div className="border border-slate-200 dark:border-[#1A364E] rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-[#0D1D2C] border-b border-slate-200 dark:border-[#1A364E] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                        <th className="py-2.5 px-3">N.º Lote</th>
                        <th className="py-2.5 px-3">Fecha Compra</th>
                        <th className="py-2.5 px-3">Proveedor Original / Mina</th>
                        <th className="py-2.5 px-3">Mineral</th>
                        <th className="py-2.5 px-3 text-right">Sacos</th>
                        <th className="py-2.5 px-3 text-right">Peso</th>
                        <th className="py-2.5 px-3">Leyes Individuales (Snapshot)</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70 dark:divide-[#1A364E]/70">
                      {ventaSeleccionada.detalles.map((det: any) => (
                        <tr key={det.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60">
                          <td className="py-2.5 px-3 font-mono-num font-bold text-slate-900 dark:text-[#F8FAFC]">
                            {det.numeroLote}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-[#94A3B8]">
                            {formatearFechaBolivia(det.fechaCompra)}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                              {det.proveedorNombre}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-[#94A3B8]">{det.minaOrigen}</div>
                          </td>
                          <td className="py-2.5 px-3">{det.tipoMineral}</td>
                          <td className="py-2.5 px-3 text-right font-mono-num font-semibold">
                            {det.sacosRegistrados}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-num font-bold">
                            {formatearNumeroBolivia(det.pesoRegistrado, 2)}{' '}
                            {det.unidadPesoRegistrada}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {(det.leyesSnapshot || []).map((l: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0F2232] border border-slate-200 dark:border-[#1A364E] font-mono-num text-[11px]"
                                >
                                  {l.simbolo}: {l.valorStr} {l.unidadMedida}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-amber-600 dark:text-amber-400">
                              VENDIDO
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

