import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Warehouse,
  CheckCircle2,
  Package,
  Scale,
  ArrowUpRight,
  PlusCircle,
  CheckSquare,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  FlaskConical,
  FileCheck2,
  TrendingUp,
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
  formatearEnteroBolivia,
  formatearNumeroBolivia,
  formatearFechaBolivia,
} from '../utils/calculations';
import { CommandCenter3DScene } from '../components/three/MineralThreeScenes';
import { useUIPreferences } from '../context/UIPreferencesContext';

export function DashboardPage() {
  const { tema } = useUIPreferences();
  const esOscuro = tema === 'dark';
  const [data, setData] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const cargarDashboard = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await apiFetch('/api/dashboard');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la información del panel.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            <span>RESUMEN GENERAL DEL NEGOCIO · BOLIVIA</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC] mt-1">
            Control de Compras, Almacén y Ventas de Minerales
          </h1>
          <p className="text-sm text-[#334155] dark:text-[#CBD5E1] mt-1 max-w-3xl">
            Revisa de forma sencilla cuántos lotes tienes disponibles en almacén, cuánto pesan tus minerales y tus últimas operaciones.
          </p>
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

      {/* Guía Rápida de 4 Pasos con Colores Diferenciados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => navigate('/compras')}
          className="text-left bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-t-4 border-t-emerald-500 hover:border-emerald-400 rounded-2xl p-4 shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              1. REGISTRAR COMPRA
            </span>
            <PlusCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xs text-[#334155] dark:text-[#94A3B8] mt-1.5">
            Ingresar nuevos lotes de mineral y sacos al almacén.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/almacen')}
          className="text-left bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-t-4 border-t-cyan-500 hover:border-cyan-400 rounded-2xl p-4 shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              2. VER MI ALMACÉN
            </span>
            <Warehouse className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xs text-[#334155] dark:text-[#94A3B8] mt-1.5">
            Ver los {formatearEnteroBolivia(ind.lotesDisponibles)} lotes guardados y sus ubicaciones.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/cotizaciones')}
          className="text-left bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-t-4 border-t-amber-500 hover:border-amber-400 rounded-2xl p-4 shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              3. PRECIOS DEL DÍA
            </span>
            <TrendingUp className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xs text-[#334155] dark:text-[#94A3B8] mt-1.5">
            Consultar o cambiar precios de Oro, Estaño y Plata.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/seleccion-venta')}
          className="text-left bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-t-4 border-t-violet-500 hover:border-violet-400 rounded-2xl p-4 shadow-sm transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
              4. VENDER LOTES
            </span>
            <CheckSquare className="w-5 h-5 text-violet-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-xs text-[#334155] dark:text-[#94A3B8] mt-1.5">
            Juntar varios lotes disponibles y cerrar una venta.
          </p>
        </button>
      </div>

      {/* HERO ASIMÉTRICO: Vista 3D + Tarjetas de Totales Diferenciadas por Color */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <CommandCenter3DScene
            lotesDisponibles={ind.lotesDisponibles}
            lotesVendidos={ind.lotesVendidos}
            pesoDisponibleKg={ind.pesoTotalDisponibleKg}
            pesoVendidoKg={ind.pesoTotalVendidoKg}
            onNavigate={(ruta) => navigate(ruta)}
          />
        </div>

        {/* Columna derecha de métricas */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {/* Tarjeta Principal: Lotes Disponibles */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#0891B2] via-[#0E7490] to-[#064E3B] dark:from-[#0B2538] dark:via-[#082B3A] dark:to-[#052E2B] text-white rounded-2xl p-5 shadow-md border border-emerald-400/40 flex-1 flex flex-col justify-between transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                Lotes Disponibles en Almacén
              </span>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-slate-950 font-mono-num">
                LISTOS PARA VENDER
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-3">
              <div>
                <div className="text-4xl font-mono-num font-extrabold text-white">
                  {formatearEnteroBolivia(ind.lotesDisponibles)}
                </div>
                <div className="text-xs text-cyan-100 mt-0.5">
                  Lotes físicos · {formatearEnteroBolivia(ind.totalSacosDisponibles)} sacos
                </div>
              </div>
              <div className="border-l border-white/20 pl-4">
                <div className="text-2xl font-mono-num font-extrabold text-amber-300">
                  {formatearNumeroBolivia(ind.pesoTotalDisponibleKg, 2)} kg
                </div>
                <div className="text-xs text-emerald-200 font-mono-num mt-0.5">
                  Peso sin humedad: {formatearNumeroBolivia(ind.pesoTotalSecoDisponibleKg || ind.pesoTotalDisponibleKg, 2)} kg
                </div>
                <div className="text-xs text-cyan-200/80 font-mono-num">
                  ({formatearNumeroBolivia(ind.pesoTotalDisponibleTm, 3)} toneladas)
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs">
              <span>Total registrados: {formatearEnteroBolivia(ind.totalLotesRegistrados)} lotes</span>
              <button
                onClick={() => navigate('/almacen')}
                className="font-bold text-amber-300 hover:underline inline-flex items-center gap-1"
              >
                <span>Ver en Mi Almacén</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Par de Tarjetas Secundarias Contrastadas (Coral y Violeta) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-rose-500 rounded-2xl p-4 shadow-sm transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400">
                  Lotes Vendidos
                </span>
                <CheckCircle2 className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-2xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-1.5">
                {formatearEnteroBolivia(ind.lotesVendidos)} lotes
              </div>
              <div className="text-xs font-mono-num font-bold text-rose-600 dark:text-rose-400 mt-1">
                Peso vendido: {formatearNumeroBolivia(ind.pesoTotalVendidoKg, 2)} kg
              </div>
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                {formatearEnteroBolivia(ind.totalSacosVendidos)} sacos entregados
              </div>
            </div>

            <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-violet-500 rounded-2xl p-4 shadow-sm transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-violet-600 dark:text-violet-400">
                  Sacos en Almacén
                </span>
                <Package className="w-5 h-5 text-violet-500" />
              </div>
              <div className="text-2xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-1.5">
                {formatearEnteroBolivia(ind.totalSacosDisponibles)} u.
              </div>
              <div className="text-xs font-mono-num font-bold text-violet-600 dark:text-violet-400 mt-1">
                Peso disponible: {formatearNumeroBolivia(ind.pesoTotalDisponibleKg, 2)} kg
              </div>
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                {ind.totalComprasOperaciones || 10} compras · {ind.totalVentasOperaciones || 2} ventas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cinta de Avisos con Colores Diferenciados (Esmeralda, Ámbar y Violeta) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alertas.map((al: any, idx: number) => {
          const estilosCard =
            idx === 0
              ? 'border-l-4 border-l-emerald-500 hover:border-emerald-400'
              : idx === 1
              ? 'border-l-4 border-l-amber-500 hover:border-amber-400'
              : 'border-l-4 border-l-violet-500 hover:border-violet-400';
          const estilosIcono =
            idx === 0
              ? 'bg-emerald-500/15 text-emerald-500'
              : idx === 1
              ? 'bg-amber-500/15 text-amber-500'
              : 'bg-violet-500/15 text-violet-500';
          return (
            <button
              key={al.id}
              type="button"
              onClick={() => navigate(al.ruta)}
              className={`bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] ${estilosCard} rounded-2xl p-4 text-left flex items-start gap-3 transition shadow-sm`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${estilosIcono}`}>
                {al.severidad === 'ADVERTENCIA' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : al.id === 'AL-M02' ? (
                  <FileCheck2 className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">{al.titulo}</div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{al.detalle}</div>
              </div>
            </button>
          );
        })}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
