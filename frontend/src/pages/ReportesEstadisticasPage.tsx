import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  FileDown,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Layers,
  Package,
  Coins,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { apiFetch } from '../utils/api';
import {
  COTIZACIONES_OFICIALES_FALLBACK,
  CotizacionReferencia,
  LoteItem,
  TIPO_CAMBIO_OFICIAL_BOB,
  calcularValorizacionGrupo,
  calcularValorizacionLote,
  formatearEnteroBolivia,
  formatearFechaBolivia,
  formatearMonedaBob,
  formatearMonedaUsd,
  formatearNumeroBolivia,
  getMineralBadgeClass,
} from '../utils/calculations';
import {
  exportarLiquidacionVentaExcel,
  exportarLiquidacionVentaPDF,
  exportarReporteGeneralExcel,
  exportarReporteGeneralPDF,
} from '../utils/reportExporter';
import { useUIPreferences } from '../context/UIPreferencesContext';

export function ReportesEstadisticasPage() {
  const { tema } = useUIPreferences();
  const esOscuro = tema === 'dark';

  const [lotes, setLotes] = useState<LoteItem[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionReferencia[]>(COTIZACIONES_OFICIALES_FALLBACK);
  const [tipoCambio, setTipoCambio] = useState<number>(TIPO_CAMBIO_OFICIAL_BOB);
  const [cargando, setCargando] = useState(true);

  const [tab, setTab] = useState<'MINERALES' | 'PROVEEDORES' | 'VENTAS' | 'LOTES'>('MINERALES');
  const [estadoFiltro, setEstadoFiltro] = useState<'TODOS' | 'DISPONIBLE' | 'VENDIDO'>('TODOS');
  const [proveedorId, setProveedorId] = useState('');
  const [mineralFiltro, setMineralFiltro] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [resLotes, resVentas, resProv, resCot] = await Promise.all([
          apiFetch<{ lotes: LoteItem[] }>('/api/lotes'),
          apiFetch<{ ventas: any[] }>('/api/ventas'),
          apiFetch<{ proveedores: any[] }>('/api/proveedores'),
          apiFetch<{ cotizaciones: CotizacionReferencia[]; tipoCambioBobUsd?: number }>('/api/cotizaciones').catch(
            () => ({ cotizaciones: COTIZACIONES_OFICIALES_FALLBACK, tipoCambioBobUsd: TIPO_CAMBIO_OFICIAL_BOB })
          ),
        ]);
        setLotes(resLotes.lotes || []);
        setVentas(resVentas.ventas || []);
        setProveedores(resProv.proveedores || []);
        if (resCot.cotizaciones?.length) setCotizaciones(resCot.cotizaciones);
        if (resCot.tipoCambioBobUsd) setTipoCambio(resCot.tipoCambioBobUsd);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const mineralesDisponibles = useMemo(() => {
    return Array.from(new Set(lotes.map((l) => l.tipoMineral).filter(Boolean))).sort();
  }, [lotes]);

  const lotesFiltrados = useMemo(() => {
    return lotes.filter((l) => {
      if (estadoFiltro !== 'TODOS' && l.estado !== estadoFiltro) return false;
      if (proveedorId && l.proveedorId !== proveedorId) return false;
      if (mineralFiltro && l.tipoMineral !== mineralFiltro) return false;
      if (desde && l.fechaCompra.slice(0, 10) < desde) return false;
      if (hasta && l.fechaCompra.slice(0, 10) > hasta) return false;
      return true;
    });
  }, [lotes, estadoFiltro, proveedorId, mineralFiltro, desde, hasta]);

  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      const f = (v.fecha || '').slice(0, 10);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      return true;
    });
  }, [ventas, desde, hasta]);

  const valTotalLotes = useMemo(
    () => calcularValorizacionGrupo(lotesFiltrados, cotizaciones, false, tipoCambio),
    [lotesFiltrados, cotizaciones, tipoCambio]
  );

  const lotesDisponiblesFiltrados = useMemo(
    () => lotesFiltrados.filter((l) => l.estado === 'DISPONIBLE'),
    [lotesFiltrados]
  );

  const valDisponibles = useMemo(
    () => calcularValorizacionGrupo(lotesDisponiblesFiltrados, cotizaciones, false, tipoCambio),
    [lotesDisponiblesFiltrados, cotizaciones, tipoCambio]
  );

  const resumenVentasFiltradas = useMemo(() => {
    let sacos = 0;
    let lotesV = 0;
    let totalBob = 0;
    let totalUsd = 0;
    for (const v of ventasFiltradas) {
      const gv = calcularValorizacionGrupo(v.detalles || [], cotizaciones, false, tipoCambio);
      sacos += Number(v.totalSacos || 0);
      lotesV += Number(v.totalLotes || 0);
      totalBob += gv.valorNetoTotalBob;
      totalUsd += gv.valorNetoTotalUsd;
    }
    return {
      operaciones: ventasFiltradas.length,
      lotesV,
      sacos,
      totalBob: Number(totalBob.toFixed(2)),
      totalUsd: Number(totalUsd.toFixed(2)),
      bsPorSaco: sacos > 0 ? Number((totalBob / sacos).toFixed(2)) : 0,
    };
  }, [ventasFiltradas, cotizaciones, tipoCambio]);

  const estadisticasMinerales = useMemo(() => {
    const map = new Map<string, LoteItem[]>();
    for (const l of lotesFiltrados) {
      const k = l.tipoMineral || 'Otros';
      const arr = map.get(k) || [];
      arr.push(l);
      map.set(k, arr);
    }
    return Array.from(map.entries())
      .map(([mineral, arr]) => {
        const g = calcularValorizacionGrupo(arr, cotizaciones, false, tipoCambio);
        const disp = arr.filter((x) => x.estado === 'DISPONIBLE').length;
        return {
          mineral,
          lotesDisponibles: disp,
          lotesVendidos: arr.length - disp,
          totalSacos: g.totalSacos,
          pesoTotalKg: g.pesoTotalKg,
          pesoPorSacoKg: g.pesoPromedioPorSacoKg,
          valorNetoBob: g.valorNetoTotalBob,
          valorNetoUsd: g.valorNetoTotalUsd,
          valorPorSacoBob: g.valorPromedioPorSacoBob,
        };
      })
      .sort((a, b) => b.valorNetoBob - a.valorNetoBob);
  }, [lotesFiltrados, cotizaciones, tipoCambio]);

  const estadisticasProveedores = useMemo(() => {
    const map = new Map<string, LoteItem[]>();
    for (const l of lotesFiltrados) {
      const k = l.proveedorNombre || 'Sin Proveedor';
      const arr = map.get(k) || [];
      arr.push(l);
      map.set(k, arr);
    }
    return Array.from(map.entries())
      .map(([proveedor, arr]) => {
        const g = calcularValorizacionGrupo(arr, cotizaciones, false, tipoCambio);
        const disp = arr.filter((x) => x.estado === 'DISPONIBLE').length;
        return {
          proveedor,
          totalLotes: arr.length,
          disponibles: disp,
          vendidos: arr.length - disp,
          totalSacos: g.totalSacos,
          pesoTotalKg: g.pesoTotalKg,
          valorNetoBob: g.valorNetoTotalBob,
        };
      })
      .sort((a, b) => b.valorNetoBob - a.valorNetoBob);
  }, [lotesFiltrados, cotizaciones, tipoCambio]);

  const limpiarFiltros = () => {
    setEstadoFiltro('TODOS');
    setProveedorId('');
    setMineralFiltro('');
    setDesde('');
    setHasta('');
  };

  const datosReporte = {
    lotes: lotesFiltrados,
    ventas: ventasFiltradas,
    estadisticasMinerales,
    estadisticasProveedores,
    cotizaciones,
    tipoCambio,
  };

  const gridColor = esOscuro ? '#1A364E' : '#E2E8F0';
  const axisColor = esOscuro ? '#CBD5E1' : '#334155';
  const tooltipStyle = {
    backgroundColor: esOscuro ? '#0A1622' : '#FFFFFF',
    borderColor: esOscuro ? '#06B6D4' : '#CBD5E1',
    color: esOscuro ? '#F8FAFC' : '#0F172A',
    borderRadius: '12px',
    fontSize: '12px',
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC]">
            Reportes y Estadísticas
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => exportarReporteGeneralPDF(datosReporte)}
            data-testid="btn-reporte-pdf"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm btn-tactile cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Descargar Reporte PDF</span>
          </button>

          <button
            type="button"
            onClick={() => exportarReporteGeneralExcel(datosReporte)}
            data-testid="btn-reporte-excel"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm btn-tactile cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Descargar Excel</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#1A364E] bg-[#F1F5F9] dark:bg-[#0F2232] text-[#0F172A] dark:text-[#F8FAFC] text-xs font-bold btn-tactile cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end no-print">
        <div>
          <label className="block text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1">
            Estado de Lote
          </label>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value as any)}
            className="w-full px-3 py-2 text-xs font-semibold bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl"
          >
            <option value="TODOS">Todos (Disp. + Vend.)</option>
            <option value="DISPONIBLE">Solo DISPONIBLE</option>
            <option value="VENDIDO">Solo VENDIDO</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1">
            Tipo de Mineral
          </label>
          <select
            value={mineralFiltro}
            onChange={(e) => setMineralFiltro(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl"
          >
            <option value="">Todos los minerales</option>
            {mineralesDisponibles.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1">
            Proveedor / Cooperativa
          </label>
          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl"
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1">
            Desde / Hasta
          </label>
          <div className="flex gap-1">
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-1/2 px-2 py-2 text-[11px] bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-lg"
            />
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-1/2 px-2 py-2 text-[11px] bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-lg"
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={limpiarFiltros}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#1A364E] bg-[#F1F5F9] dark:bg-[#0F2232] text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>

      {/* KPIs Globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-cyan-500 rounded-2xl p-4 shadow-sm card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-cyan-600 dark:text-cyan-400">Lotes Analizados</span>
            <Layers className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="text-2xl font-mono-num font-extrabold mt-1 text-[#0F172A] dark:text-[#F8FAFC]">
            {formatearEnteroBolivia(lotesFiltrados.length)} lotes
          </div>
          <div className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-1">
            {lotesDisponiblesFiltrados.length} disponibles · {lotesFiltrados.length - lotesDisponiblesFiltrados.length} vendidos
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-violet-500 rounded-2xl p-4 shadow-sm card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-violet-600 dark:text-violet-400">Total Sacos y Peso</span>
            <Package className="w-5 h-5 text-violet-500" />
          </div>
          <div className="text-2xl font-mono-num font-extrabold mt-1 text-[#0F172A] dark:text-[#F8FAFC]">
            {formatearEnteroBolivia(valTotalLotes.totalSacos)} sacos
          </div>
          <div className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-1">
            {formatearNumeroBolivia(valTotalLotes.pesoTotalKg, 2)} kg ({formatearNumeroBolivia(valTotalLotes.pesoPromedioPorSacoKg, 1)} kg/saco)
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-emerald-500 rounded-2xl p-4 shadow-sm card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">Valor Stock Disponible</span>
            <Coins className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-mono-num font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
            {formatearMonedaBob(valDisponibles.valorNetoTotalBob)}
          </div>
          <div className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-1">
            {formatearMonedaUsd(valDisponibles.valorNetoTotalUsd)} · {formatearMonedaBob(valDisponibles.valorPromedioPorSacoBob)}/saco
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-amber-500 rounded-2xl p-4 shadow-sm card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Total Ventas Cerradas</span>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-mono-num font-extrabold mt-1 text-amber-600 dark:text-amber-400">
            {formatearMonedaBob(resumenVentasFiltradas.totalBob)}
          </div>
          <div className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-1">
            {resumenVentasFiltradas.operaciones} venta(s) · {formatearEnteroBolivia(resumenVentasFiltradas.sacos)} sacos
          </div>
        </div>
      </div>

      {/* Pestañas de Estadísticas */}
      <div className="flex flex-wrap gap-2 no-print">
        {[
          { id: 'MINERALES', label: `Por Mineral (${estadisticasMinerales.length})` },
          { id: 'PROVEEDORES', label: `Por Proveedor (${estadisticasProveedores.length})` },
          { id: 'VENTAS', label: `Resumen de Ventas (${ventasFiltradas.length})` },
          { id: 'LOTES', label: `Detalle de Lotes y Sacos (${lotesFiltrados.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === t.id
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#041019]'
                : 'bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] text-[#334155] dark:text-[#94A3B8]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="p-10 text-center text-[#64748B] bg-white dark:bg-[#0A1622] rounded-2xl border border-[#CBD5E1] dark:border-[#1A364E]">
          Calculando estadísticas y reportes...
        </div>
      ) : tab === 'MINERALES' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold mb-4 text-[#0F172A] dark:text-[#F8FAFC]">
              Valor Estimado (Bs) y Sacos por Tipo de Mineral
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="w-full" style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={estadisticasMinerales}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="mineral" stroke={axisColor} tick={{ fontSize: 12 }} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="valorNetoBob" name="Valor Neto (Bs)" fill="#10B981" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full" style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={estadisticasMinerales}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="mineral" stroke={axisColor} tick={{ fontSize: 12 }} />
                    <YAxis stroke={axisColor} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="totalSacos" name="Total Sacos" fill="#8B5CF6" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#060D14] border-b border-[#E2E8F0] dark:border-[#152E42] text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
                    <th className="py-3 px-4">Mineral</th>
                    <th className="py-3 px-3 text-right">Disp.</th>
                    <th className="py-3 px-3 text-right">Vend.</th>
                    <th className="py-3 px-3 text-right">Total Sacos</th>
                    <th className="py-3 px-3 text-right">kg / Saco</th>
                    <th className="py-3 px-3 text-right">Peso Total</th>
                    <th className="py-3 px-3 text-right">Bs / Saco</th>
                    <th className="py-3 px-4 text-right">Valor Neto (Bs / $US)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#152E42] text-xs">
                  {estadisticasMinerales.map((m) => (
                    <tr key={m.mineral} className="hover:bg-slate-50 dark:hover:bg-[#0F2232]/50">
                      <td className="py-3 px-4 font-bold text-[#0F172A] dark:text-[#F8FAFC]">{m.mineral}</td>
                      <td className="py-3 px-3 text-right font-mono-num text-emerald-600 dark:text-emerald-400 font-bold">{m.lotesDisponibles}</td>
                      <td className="py-3 px-3 text-right font-mono-num text-rose-600 dark:text-rose-400 font-bold">{m.lotesVendidos}</td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold">{formatearEnteroBolivia(m.totalSacos)}</td>
                      <td className="py-3 px-3 text-right font-mono-num">{formatearNumeroBolivia(m.pesoPorSacoKg, 2)} kg</td>
                      <td className="py-3 px-3 text-right font-mono-num">{formatearNumeroBolivia(m.pesoTotalKg, 2)} kg</td>
                      <td className="py-3 px-3 text-right font-mono-num text-amber-600 dark:text-amber-400 font-bold">
                        {formatearMonedaBob(m.valorPorSacoBob)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{formatearMonedaBob(m.valorNetoBob)}</span>
                        <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{formatearMonedaUsd(m.valorNetoUsd)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : tab === 'PROVEEDORES' ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm">
            <h2 className="text-base font-bold mb-4 text-[#0F172A] dark:text-[#F8FAFC]">
              Sacos y Peso Total Aportado por Proveedor
            </h2>
            <div className="w-full" style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={estadisticasProveedores}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="proveedor" stroke={axisColor} tick={{ fontSize: 10 }} />
                  <YAxis stroke={axisColor} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="disponibles" name="Lotes Disponibles" fill="#06B6D4" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="vendidos" name="Lotes Vendidos" fill="#F43F5E" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#060D14] border-b border-[#E2E8F0] dark:border-[#152E42] text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
                    <th className="py-3 px-4">Proveedor / Cooperativa</th>
                    <th className="py-3 px-3 text-right">Total Lotes</th>
                    <th className="py-3 px-3 text-right">Disponibles</th>
                    <th className="py-3 px-3 text-right">Vendidos</th>
                    <th className="py-3 px-3 text-right">Total Sacos</th>
                    <th className="py-3 px-3 text-right">Peso Total</th>
                    <th className="py-3 px-4 text-right">Valor Estimado (Bs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#152E42] text-xs">
                  {estadisticasProveedores.map((p) => (
                    <tr key={p.proveedor} className="hover:bg-slate-50 dark:hover:bg-[#0F2232]/50">
                      <td className="py-3 px-4 font-bold text-[#0F172A] dark:text-[#F8FAFC]">{p.proveedor}</td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold">{p.totalLotes}</td>
                      <td className="py-3 px-3 text-right font-mono-num text-emerald-600 dark:text-emerald-400 font-bold">{p.disponibles}</td>
                      <td className="py-3 px-3 text-right font-mono-num text-rose-600 dark:text-rose-400 font-bold">{p.vendidos}</td>
                      <td className="py-3 px-3 text-right font-mono-num">{formatearEnteroBolivia(p.totalSacos)}</td>
                      <td className="py-3 px-3 text-right font-mono-num">{formatearNumeroBolivia(p.pesoTotalKg, 2)} kg</td>
                      <td className="py-3 px-4 text-right font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                        {formatearMonedaBob(p.valorNetoBob)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : tab === 'VENTAS' ? (
        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#060D14] border-b border-[#E2E8F0] dark:border-[#152E42] text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
                  <th className="py-3 px-4">N.º Venta</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Comprador</th>
                  <th className="py-3 px-3 text-right">Lotes</th>
                  <th className="py-3 px-3 text-right">Sacos (kg/u)</th>
                  <th className="py-3 px-3 text-right">Peso Total</th>
                  <th className="py-3 px-3 text-right">Bs / Saco</th>
                  <th className="py-3 px-3 text-right">Total Recibido (Bs)</th>
                  <th className="py-3 px-4 text-right">Reportes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#152E42] text-xs">
                {ventasFiltradas.map((v) => {
                  const gv = calcularValorizacionGrupo(v.detalles || [], cotizaciones, false, tipoCambio);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-[#0F2232]/50">
                      <td className="py-3 px-4 font-mono-num font-bold text-cyan-600 dark:text-cyan-400">{v.numeroVenta}</td>
                      <td className="py-3 px-3">{formatearFechaBolivia(v.fecha)}</td>
                      <td className="py-3 px-3 font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{v.compradorNombre}</td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold">{v.totalLotes}</td>
                      <td className="py-3 px-3 text-right font-mono-num">
                        {formatearEnteroBolivia(v.totalSacos)}
                        <span className="block text-[10px] text-[#64748B] dark:text-[#94A3B8]">{formatearNumeroBolivia(gv.pesoPromedioPorSacoKg, 1)} kg/u</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num">{formatearNumeroBolivia(v.pesoTotalKg, 2)} kg</td>
                      <td className="py-3 px-3 text-right font-mono-num text-amber-600 dark:text-amber-400 font-bold">
                        {formatearMonedaBob(gv.valorPromedioPorSacoBob)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{formatearMonedaBob(gv.valorNetoTotalBob)}</span>
                        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{formatearMonedaUsd(gv.valorNetoTotalUsd)}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => exportarLiquidacionVentaPDF(v, cotizaciones, tipoCambio)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => exportarLiquidacionVentaExcel(v, cotizaciones, tipoCambio)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold"
                          >
                            Excel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#060D14] border-b border-[#E2E8F0] dark:border-[#152E42] text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
                  <th className="py-3 px-4">N.º Lote</th>
                  <th className="py-3 px-3">Proveedor / Mineral</th>
                  <th className="py-3 px-3 text-right">Sacos</th>
                  <th className="py-3 px-3 text-right">kg / Saco</th>
                  <th className="py-3 px-3 text-right">Peso</th>
                  <th className="py-3 px-3">Leyes</th>
                  <th className="py-3 px-3 text-right">Bs / Saco</th>
                  <th className="py-3 px-3 text-right">Valor Lote (Bs)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#152E42] text-xs">
                {lotesFiltrados.map((l) => {
                  const vl = calcularValorizacionLote(l, cotizaciones, false, tipoCambio);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-[#0F2232]/50">
                      <td className="py-3 px-4 font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">{l.numeroLote}</td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{l.proveedorNombre}</div>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{l.tipoMineral}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold">{l.cantidadSacos}</td>
                      <td className="py-3 px-3 text-right font-mono-num">{formatearNumeroBolivia(vl.pesoPorSacoKg, 1)} kg</td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold">{formatearNumeroBolivia(l.pesoNeto, 2)} {l.unidadPeso}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {l.leyes.map((ley) => (
                            <span key={ley.codigoLey} className={`px-2 py-0.5 rounded text-[10px] font-mono-num font-bold border ${getMineralBadgeClass(ley.simbolo)}`}>
                              {ley.simbolo}: {ley.valorStr}{ley.unidadMedida}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num text-amber-600 dark:text-amber-400 font-bold">
                        {formatearMonedaBob(vl.valorPorSacoBob)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                        {formatearMonedaBob(vl.valorNetoBob)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          l.estado === 'DISPONIBLE'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}>
                          {l.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
