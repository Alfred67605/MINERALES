import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Scale,
  ArrowUpRight,
  PlusCircle,
  CheckSquare,
  RefreshCw,
  TrendingUp,
  Coins,
  Layers,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { motion } from 'motion/react';
import { apiFetch } from '../utils/api';
import {
  COTIZACIONES_OFICIALES_FALLBACK,
  CotizacionReferencia,
  LoteItem,
  TIPO_CAMBIO_OFICIAL_BOB,
  calcularValorizacionGrupo,
  formatearEnteroBolivia,
  formatearMonedaBob,
  formatearMonedaUsd,
  formatearNumeroBolivia,
  formatearFechaBolivia,
} from '../utils/calculations';
import { useUIPreferences } from '../context/UIPreferencesContext';

export function DashboardPage() {
  const { tema } = useUIPreferences();
  const esOscuro = tema === 'dark';
  const [data, setData] = useState<any>(null);
  const [lotesDisp, setLotesDisp] = useState<LoteItem[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionReferencia[]>(COTIZACIONES_OFICIALES_FALLBACK);
  const [tipoCambio, setTipoCambio] = useState<number>(TIPO_CAMBIO_OFICIAL_BOB);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const cargarDashboard = async () => {
    setCargando(true);
    setError('');
    try {
      const [res, resLotes, resCot] = await Promise.all([
        apiFetch('/api/dashboard'),
        apiFetch<{ lotes: LoteItem[] }>('/api/lotes?estado=DISPONIBLE'),
        apiFetch<{ cotizaciones: CotizacionReferencia[]; tipoCambioBobUsd?: number }>('/api/cotizaciones').catch(
          () => ({ cotizaciones: COTIZACIONES_OFICIALES_FALLBACK, tipoCambioBobUsd: TIPO_CAMBIO_OFICIAL_BOB })
        ),
      ]);
      setData(res);
      setLotesDisp(resLotes.lotes || []);
      if (resCot.cotizaciones?.length) setCotizaciones(resCot.cotizaciones);
      if (resCot.tipoCambioBobUsd) setTipoCambio(resCot.tipoCambioBobUsd);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la información del panel.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const valorizacionStock = useMemo(
    () => calcularValorizacionGrupo(lotesDisp, cotizaciones, false, tipoCambio),
    [lotesDisp, cotizaciones, tipoCambio]
  );

  const resumenPorMineral = useMemo(() => {
    const grupos = new Map<string, LoteItem[]>();
    for (const l of lotesDisp) {
      const k = l.tipoMineral || 'Otros';
      const arr = grupos.get(k) || [];
      arr.push(l);
      grupos.set(k, arr);
    }
    return Array.from(grupos.entries())
      .map(([mineral, lista]) => ({
        mineral,
        val: calcularValorizacionGrupo(lista, cotizaciones, false, tipoCambio),
      }))
      .sort((a, b) => b.val.valorNetoTotalBob - a.val.valorNetoTotalBob);
  }, [lotesDisp, cotizaciones, tipoCambio]);

  if (cargando && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-200 dark:bg-[#0F2232] rounded-2xl" />
        <div className="h-72 bg-slate-200 dark:bg-[#0F2232] rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-400 dark:border-rose-500/40 rounded-2xl p-6 text-rose-800 dark:text-rose-200">
        <h2 className="font-bold text-base">Error al cargar el Dashboard</h2>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={cargarDashboard}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const ind = data.indicadores;
  const graf = data.graficos;
  const alertas = data.alertasOperativas || [];

  const PIE_COLORS = ['#10B981', '#F43F5E'];
  const gridColor = esOscuro ? '#1A364E' : '#E2E8F0';
  const axisColor = esOscuro ? '#CBD5E1' : '#334155';
  const tooltipStyle = {
    backgroundColor: esOscuro ? '#0A1622' : '#FFFFFF',
    borderColor: esOscuro ? '#06B6D4' : '#CBD5E1',
    color: esOscuro ? '#F8FAFC' : '#0F172A',
    borderRadius: '12px',
    fontSize: '13px',
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Sencilla y Clara para el Cliente */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC] mt-1">
            Resumen del Negocio
          </h1>
        </div>

        {/* Botones de Acción Rápida con Colores Distintivos */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/compras')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Compra</span>
          </button>

          <button
            onClick={() => navigate('/cotizaciones')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Ver Precios</span>
          </button>

          <button
            onClick={cargarDashboard}
            className="p-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#1A364E] bg-[#F1F5F9] dark:bg-[#0F2232] text-[#334155] dark:text-[#F8FAFC] hover:border-cyan-400 transition"
            title="Actualizar datos ahora"
            aria-label="Actualizar datos del resumen"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/seleccion-venta')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-sm transition"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Vender Lotes</span>
          </button>
        </div>
      </div>

      {/* Resumen Operativo y Valorizado en Bs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#0891B2] via-[#0E7490] to-[#064E3B] dark:from-[#0B2538] dark:via-[#082B3A] dark:to-[#052E2B] text-white rounded-2xl p-5 shadow-md border border-emerald-400/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-200">Lotes Disponibles en Almacén</span>
            <Layers className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="text-3xl font-mono-num font-extrabold mt-2">
            {formatearEnteroBolivia(ind.lotesDisponibles)} lotes
          </div>
          <div className="flex items-center justify-between text-xs text-cyan-100 mt-3 pt-2 border-t border-white/15">
            <span>Total históricos: {formatearEnteroBolivia(ind.totalLotesRegistrados)}</span>
            <button onClick={() => navigate('/almacen')} className="font-bold text-amber-300 hover:underline inline-flex items-center gap-1">
              Ver <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-violet-500 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">Sacos en Almacén</span>
            <Package className="w-5 h-5 text-violet-500" />
          </div>
          <div className="text-3xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-2">
            {formatearEnteroBolivia(ind.totalSacosDisponibles)} sacos
          </div>
          <div className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#152E42] flex items-center justify-between gap-2">
            <span>{formatearNumeroBolivia(valorizacionStock.pesoPromedioPorSacoKg, 2)} kg/saco</span>
            <span>{formatearNumeroBolivia(valorizacionStock.sacosPromedioPorLote, 1)} sacos/lote</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-amber-500 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Peso Disponible</span>
            <Scale className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-2">
            {formatearNumeroBolivia(ind.pesoTotalDisponibleKg, 2)} kg
          </div>
          <div className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#152E42] flex items-center justify-between gap-2">
            <span>Seco: {formatearNumeroBolivia(ind.pesoTotalSecoDisponibleKg || ind.pesoTotalDisponibleKg, 2)} kg</span>
            <span>{formatearNumeroBolivia(ind.pesoTotalDisponibleTm, 2)} TM</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-emerald-500 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Valor Estimado Stock (Bs)</span>
            <Coins className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-mono-num font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatearMonedaBob(valorizacionStock.valorNetoTotalBob)}
          </div>
          <div className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-3 pt-2 border-t border-[#E2E8F0] dark:border-[#152E42] flex justify-between">
            <span>{formatearMonedaUsd(valorizacionStock.valorNetoTotalUsd)}</span>
            <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{formatearMonedaBob(valorizacionStock.valorPromedioPorSacoBob)}/saco</strong>
          </div>
        </div>
      </div>

      {/* Desglose detallado de Sacos y Valor en Bs por Mineral + Resumen de Ventas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Detalle del Almacén por Mineral, Sacos y Valor en Bolivianos
            </h2>
            <button
              onClick={() => navigate('/reportes')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              <BarChart3 className="w-4 h-4" /> Reportes y Estadísticas
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] dark:border-[#152E42] text-[#64748B] dark:text-[#94A3B8]">
                  <th>Tipo de Mineral</th>
                  <th className="text-right">Lotes</th>
                  <th className="text-right">Sacos</th>
                  <th className="text-right">kg / Saco</th>
                  <th className="text-right">Peso Total</th>
                  <th className="text-right">Bs / Saco</th>
                  <th className="text-right">Valor Estimado (Bs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#152E42]">
                {resumenPorMineral.map(({ mineral, val }) => (
                  <tr key={mineral} className="hover:bg-slate-50 dark:hover:bg-[#0F2232]/50">
                    <td className="py-3 font-bold text-[#0F172A] dark:text-[#F8FAFC]">{mineral}</td>
                    <td className="py-3 text-right font-mono-num">{val.totalLotes}</td>
                    <td className="py-3 text-right font-mono-num font-bold text-violet-600 dark:text-violet-400">
                      {formatearEnteroBolivia(val.totalSacos)}
                    </td>
                    <td className="py-3 text-right font-mono-num">{formatearNumeroBolivia(val.pesoPromedioPorSacoKg, 1)} kg</td>
                    <td className="py-3 text-right font-mono-num">{formatearNumeroBolivia(val.pesoTotalKg, 2)} kg</td>
                    <td className="py-3 text-right font-mono-num text-amber-600 dark:text-amber-400 font-semibold">
                      {formatearMonedaBob(val.valorPromedioPorSacoBob)}
                    </td>
                    <td className="py-3 text-right font-mono-num font-bold text-emerald-600 dark:text-emerald-400">
                      {formatearMonedaBob(val.valorNetoTotalBob)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-rose-500 rounded-2xl p-5 shadow-sm flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Lotes Vendidos</span>
              <CheckCircle2 className="w-5 h-5 text-rose-500" />
            </div>
            <div className="text-3xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-2">
              {formatearEnteroBolivia(ind.lotesVendidos)} lotes
            </div>
            <div className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-2 space-y-1">
              <div className="font-bold text-rose-600 dark:text-rose-400">
                Peso vendido: {formatearNumeroBolivia(ind.pesoTotalVendidoKg, 2)} kg
              </div>
              <div>{formatearEnteroBolivia(ind.totalSacosVendidos)} sacos entregados · {ind.totalVentasOperaciones || 0} ventas</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-cyan-500 rounded-2xl p-5 shadow-sm flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">Promedio por Lote en Almacén</span>
              <Package className="w-5 h-5 text-cyan-500" />
            </div>
            <div className="text-2xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-2">
              {formatearMonedaBob(valorizacionStock.valorPromedioPorLoteBob)}
            </div>
            <div className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-2">
              {formatearMonedaUsd(valorizacionStock.valorPromedioPorLoteUsd)} / lote · Valor bruto {formatearMonedaBob(valorizacionStock.valorBrutoTotalBob)}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Analíticos Multicolor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Peso en Almacén por Fecha (kg)
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Compara cuánto mineral entró por compras, cuánto salió por ventas y cuánto queda guardado.
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graf.evolucionPesoAlmacen}>
                <defs>
                  <linearGradient id="gradDispV2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="fecha" tick={{ fontSize: 12, fill: axisColor }} />
                <YAxis tick={{ fontSize: 12, fill: axisColor }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '13px', color: axisColor }} />
                <Area
                  type="monotone"
                  dataKey="pesoDisponibleKg"
                  name="Disponible en Almacén (kg)"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  fill="url(#gradDispV2)"
                />
                <Area
                  type="monotone"
                  dataKey="entradaKg"
                  name="Compras Ingresadas (kg)"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={0}
                />
                <Area
                  type="monotone"
                  dataKey="salidaKg"
                  name="Ventas Entregadas (kg)"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Tus Minerales en Almacén
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Cantidad de lotes disponibles vs. vendidos y resumen por tipo de mineral.
            </p>
          </div>

          <div className="h-48 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={graf.proporcionEstados}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={4}
                >
                  {graf.proporcionEstados.map((_: any, index: number) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-[#CBD5E1] dark:border-[#1A364E]">
            {(graf.distribucionPorMineral || []).map((m: any, i: number) => (
              <div
                key={m.mineral}
                className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[#F1F5F9] dark:bg-[#060D14] border border-transparent dark:border-[#1A364E]"
              >
                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{m.mineral}</span>
                <span
                  className={`font-mono-num font-bold ${
                    i === 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {m.lotesDisponibles} lotes · {formatearNumeroBolivia(m.pesoDisponibleKg, 0)} kg
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribución por Proveedor y Compras por Fecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm transition-colors">
          <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Lotes por Proveedor / Cooperativa
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
            Cuántos lotes disponibles y vendidos provienen de cada proveedor o mina.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graf.distribucionPorProveedor} layout="vertical" margin={{ left: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis type="number" tick={{ fontSize: 12, fill: axisColor }} />
                <YAxis
                  dataKey="proveedor"
                  type="category"
                  width={220}
                  tick={{ fontSize: 12, fill: axisColor }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Bar dataKey="disponibles" name="Lotes Disponibles" stackId="a" fill="#10B981" />
                <Bar dataKey="vendidos" name="Lotes Vendidos" stackId="a" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm transition-colors">
          <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Compras Recibidas por Fecha
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-4">
            Cantidad de lotes ingresados al almacén en cada fecha.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graf.comprasPorFecha}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis tick={{ fontSize: 12, fill: axisColor }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Bar dataKey="lotes" name="Lotes Ingresados" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tablas de Actividad Reciente con Nombres Completos y Estado M-02 */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Últimas Compras Registradas
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Lotes ingresados recientemente al almacén
              </p>
            </div>
            <button
              onClick={() => navigate('/compras')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#CBD5E1] dark:border-[#1A364E] text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
                  <th className="py-2.5 px-2">Compra / Doc.</th>
                  <th className="py-2.5 px-2">Fecha</th>
                  <th className="py-2.5 px-2">Proveedor</th>
                  <th className="py-2.5 px-2 text-right">Lotes</th>
                  <th className="py-2.5 px-2 text-right">Peso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]/60 dark:divide-[#1A364E]/60 text-xs">
                {data.comprasRecientes.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[#F1F5F9] dark:hover:bg-[#0F2232]/60 transition">
                    <td className="py-2.5 px-2">
                      <span className="font-mono-num font-bold text-emerald-600 dark:text-emerald-400 block">
                        {c.numeroCompra}
                      </span>
                      <span className="text-[10px] font-mono-num text-[#64748B] dark:text-[#94A3B8]">
                        {c.expedienteM02 || 'Recibido'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-[#334155] dark:text-[#94A3B8]">
                      {formatearFechaBolivia(c.fecha)}
                    </td>
                    <td className="py-2.5 px-2 font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                      {c.proveedorNombre}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono-num font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      {c.cantidadLotes}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {formatearNumeroBolivia(c.pesoTotalKg, 2)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Ventas Realizadas Recientemente
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Liquidaciones cerradas por comprador
              </p>
            </div>
            <button
              onClick={() => navigate('/historial-ventas')}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Ver historial</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#CBD5E1] dark:border-[#1A364E] text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
                  <th className="py-2.5 px-2">N.º Venta</th>
                  <th className="py-2.5 px-2">Fecha</th>
                  <th className="py-2.5 px-2">Comprador</th>
                  <th className="py-2.5 px-2 text-right">Lotes</th>
                  <th className="py-2.5 px-2 text-right">Peso Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]/60 dark:divide-[#1A364E]/60 text-xs">
                {data.ventasRecientes.map((v: any) => (
                  <tr key={v.id} className="hover:bg-[#F1F5F9] dark:hover:bg-[#0F2232]/60 transition">
                    <td className="py-2.5 px-2 font-mono-num font-bold text-rose-600 dark:text-rose-400">
                      {v.numeroVenta}
                    </td>
                    <td className="py-2.5 px-2 text-[#334155] dark:text-[#94A3B8]">
                      {formatearFechaBolivia(v.fecha)}
                    </td>
                    <td className="py-2.5 px-2 font-medium text-[#0F172A] dark:text-[#F8FAFC]">
                      {v.compradorNombre}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono-num font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      {v.totalLotes}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {formatearNumeroBolivia(v.pesoTotalKg, 2)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
