import React, { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  RotateCcw,
  Edit3,
  Check,
  X,
  Search,
  Filter,
  Sparkles,
  Zap,
  Building2,
  Sliders,
  Scale,
  Layers,
  ArrowRight,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/api';
import { formatearNumeroBolivia, formatearEnteroBolivia } from '../utils/calculations';

interface CotizacionItem {
  id: string;
  mineral: string;
  subtipo?: string;
  simbolo: string;
  unidad: 'L.F.' | 'O.T.' | 'T.M.F.' | 'T.M.';
  unidadNombre: string;
  cotizacionUsd: number;
  cotizacionBob: number;
  variacionPct?: number;
  alicuotaRegalia: number;
  quincena: string;
  fechaActualizacion: string;
  origen: 'OFICIAL' | 'EN_VIVO' | 'MANUAL';
  categoria: 'PRECIOSOS' | 'BASICOS' | 'ESTRATEGICOS' | 'NO_METALICOS';
}

export function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionItem[]>([]);
  const [modo, setModo] = useState<'OFICIAL' | 'EN_VIVO' | 'MANUAL'>('OFICIAL');
  const [tipoCambio, setTipoCambio] = useState(11.92);
  const [dolarInfo, setDolarInfo] = useState<any | null>(null);
  const [tcManualInput, setTcManualInput] = useState('11.92');
  const [cambiandoDolar, setCambiandoDolar] = useState(false);
  const [quincena, setQuincena] = useState('2ª. QUINCENA NOVIEMBRE 2026');
  const [cargando, setCargando] = useState(true);
  const [q, setQ] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('TODOS');

  // Estado de edición manual inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valorEditUsd, setValorEditUsd] = useState<string>('');
  const [alicuotaEdit, setAlicuotaEdit] = useState<string>('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeNotif, setMensajeNotif] = useState('');

  // Simulador de Valorización
  const [simuladorMineralId, setSimuladorMineralId] = useState<string>('');
  const [simPrecioManual, setSimPrecioManual] = useState<string>('');
  const [simPesoKg, setSimPesoKg] = useState<string>('1500');
  const [simLey, setSimLey] = useState<string>('48.50');
  const [simMaquilaUsd, setSimMaquilaUsd] = useState<string>('80');
  const [simResultado, setSimResultado] = useState<any | null>(null);

  const cargarCotizaciones = async () => {
    setCargando(true);
    try {
      const res = await apiFetch<any>('/api/cotizaciones');
      setCotizaciones(res.cotizaciones);
      setModo(res.modo);
      setTipoCambio(res.tipoCambio || 11.92);
      if (res.dolar) {
        setDolarInfo(res.dolar);
        setTcManualInput(String(res.dolar.tipoCambioActivo || res.tipoCambio || 11.92));
      }
      setQuincena(res.quincena || '2ª. QUINCENA NOVIEMBRE 2026');
      if (res.cotizaciones.length > 0 && !simuladorMineralId) {
        setSimuladorMineralId(res.cotizaciones[1]?.id || res.cotizaciones[0].id); // Default Estaño
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cambiarModo = async (nuevoModo: 'OFICIAL' | 'EN_VIVO' | 'MANUAL') => {
    setCargando(true);
    try {
      const res = await apiFetch<any>('/api/cotizaciones/modo', {
        method: 'POST',
        body: JSON.stringify({ modo: nuevoModo }),
      });
      setCotizaciones(res.cotizaciones);
      setModo(res.modo);
      setMensajeNotif(res.mensaje);
      setTimeout(() => setMensajeNotif(''), 4000);
    } finally {
      setCargando(false);
    }
  };

  const restaurarOficial = async () => {
    setCargando(true);
    try {
      const res = await apiFetch<any>('/api/cotizaciones/reset', { method: 'POST' });
      setCotizaciones(res.cotizaciones);
      setModo(res.modo);
      if (res.dolar) setDolarInfo(res.dolar);
      setMensajeNotif('Valores restablecidos a la tabla oficial del Ministerio de Minería.');
      setTimeout(() => setMensajeNotif(''), 4000);
    } finally {
      setCargando(false);
    }
  };

  const cambiarDolar = async (
    modoDolar: 'PARALELO' | 'BCB_REFERENCIAL' | 'BCB_OFICIAL' | 'MANUAL',
    sincronizarEnVivo = false
  ) => {
    const manualNum = parseFloat(tcManualInput);
    if (modoDolar === 'MANUAL' && (isNaN(manualNum) || manualNum <= 0)) return;
    setCambiandoDolar(true);
    try {
      const res = await apiFetch<any>('/api/cotizaciones/dolar', {
        method: 'POST',
        body: JSON.stringify({
          modoDolar,
          tipoCambioManual: modoDolar === 'MANUAL' ? manualNum : undefined,
          sincronizarEnVivo,
        }),
      });
      setCotizaciones(res.cotizaciones);
      setTipoCambio(res.tipoCambio);
      if (res.dolar) {
        setDolarInfo(res.dolar);
        setTcManualInput(String(res.tipoCambio));
      }
      window.dispatchEvent(new CustomEvent('mf-dolar-actualizado', { detail: { tipoCambio: res.tipoCambio } }));
      setMensajeNotif(res.mensaje);
      setTimeout(() => setMensajeNotif(''), 4500);
    } finally {
      setCambiandoDolar(false);
    }
  };

  const iniciarEdicion = (item: CotizacionItem) => {
    setEditandoId(item.id);
    setValorEditUsd(String(item.cotizacionUsd));
    setAlicuotaEdit(String(item.alicuotaRegalia));
  };

  const guardarEdicionManual = async (id: string) => {
    const numUsd = parseFloat(valorEditUsd);
    if (isNaN(numUsd) || numUsd <= 0) return;
    setGuardando(true);
    try {
      const res = await apiFetch<any>(`/api/cotizaciones/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          cotizacionUsd: numUsd,
          alicuotaRegalia: alicuotaEdit ? parseFloat(alicuotaEdit) : undefined,
        }),
      });
      setCotizaciones((prev) =>
        prev.map((c) => (c.id === id ? res.cotizacion : { ...c, origen: 'MANUAL' }))
      );
      setModo('MANUAL');
      setEditandoId(null);
      setMensajeNotif(res.mensaje);
      setTimeout(() => setMensajeNotif(''), 4000);
    } finally {
      setGuardando(false);
    }
  };

  // Sincronizar cotización del simulador al cambiar de mineral o recargar
  useEffect(() => {
    const item = cotizaciones.find((c) => c.id === simuladorMineralId);
    if (item) {
      setSimPrecioManual(String(item.cotizacionUsd));
    }
  }, [simuladorMineralId, cotizaciones]);

  // Ejecutar cálculo del simulador
  useEffect(() => {
    if (!simuladorMineralId || !simPesoKg || !simLey) return;
    const item = cotizaciones.find((c) => c.id === simuladorMineralId);
    if (!item) return;

    const peso = parseFloat(simPesoKg) || 0;
    const ley = parseFloat(simLey) || 0;
    const maquila = parseFloat(simMaquilaUsd) || 0;
    const precioAplicado = parseFloat(simPrecioManual) || item.cotizacionUsd;

    let pesoFino = 0;
    if (item.unidad === 'L.F.') {
      pesoFino = (peso * (ley / 100)) * 2.20462;
    } else if (item.unidad === 'O.T.') {
      pesoFino = ((peso / 1000) * ley) / 31.1035;
    } else if (item.unidad === 'T.M.F.') {
      pesoFino = (peso / 1000) * (ley / 100);
    } else {
      pesoFino = peso / 1000;
    }

    const brutoUsd = pesoFino * precioAplicado;
    const regaliaUsd = brutoUsd * (item.alicuotaRegalia / 100);
    const netoUsd = Math.max(0, brutoUsd - regaliaUsd - maquila);

    setSimResultado({
      mineral: item.mineral,
      simbolo: item.simbolo,
      unidad: item.unidad,
      cotizacionUsd: precioAplicado,
      pesoFinoEnUnidad: Number(pesoFino.toFixed(4)),
      valorBrutoUsd: Number(brutoUsd.toFixed(2)),
      valorBrutoBob: Number((brutoUsd * tipoCambio).toFixed(2)),
      regaliaUsd: Number(regaliaUsd.toFixed(2)),
      regaliaBob: Number((regaliaUsd * tipoCambio).toFixed(2)),
      alicuota: item.alicuotaRegalia,
      valorNetoUsd: Number(netoUsd.toFixed(2)),
      valorNetoBob: Number((netoUsd * tipoCambio).toFixed(2)),
    });
  }, [simuladorMineralId, simPrecioManual, simPesoKg, simLey, simMaquilaUsd, cotizaciones, tipoCambio]);

  const kpiDestacados = useMemo(() => {
    const ids = ['COT-AU-STD', 'COT-SN', 'COT-AG', 'COT-ZN'];
    return ids.map((id) => cotizaciones.find((c) => c.id === id)).filter(Boolean) as CotizacionItem[];
  }, [cotizaciones]);

  const cotizacionesFiltradas = useMemo(() => {
    return cotizaciones.filter((item) => {
      if (categoriaFiltro !== 'TODOS' && item.categoria !== categoriaFiltro) {
        return false;
      }
      if (q.trim()) {
        const term = q.trim().toLowerCase();
        const coincide =
          item.mineral.toLowerCase().includes(term) ||
          item.simbolo.toLowerCase().includes(term) ||
          (item.subtipo && item.subtipo.toLowerCase().includes(term)) ||
          item.unidad.toLowerCase().includes(term);
        if (!coincide) return false;
      }
      return true;
    });
  }, [cotizaciones, categoriaFiltro, q]);

  const colorIconoMineral: Record<string, string> = {
    Zn: 'bg-cyan-600',
    Sn: 'bg-emerald-600',
    Au: 'bg-amber-500 text-slate-950',
    Ag: 'bg-violet-600',
    Pb: 'bg-indigo-600',
    Cu: 'bg-orange-600',
    Sb: 'bg-teal-600',
    W: 'bg-blue-600',
    Bi: 'bg-rose-600',
    CaCO3: 'bg-slate-500',
  };

  const bordeKpiPorSimbolo: Record<string, string> = {
    Au: 'border-t-4 border-t-amber-400',
    Sn: 'border-t-4 border-t-emerald-400',
    Ag: 'border-t-4 border-t-violet-400',
    Zn: 'border-t-4 border-t-cyan-400',
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Clara y Control de Modos */}
      <div className="bg-[#FFFFFF] dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC] mt-1">
            Precios de Minerales
          </h1>
        </div>

        {/* Conmutador de 3 Modos con Colores Vivos */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex flex-wrap rounded-xl bg-[#F1F5F9] dark:bg-[#060D14] p-1 border border-[#CBD5E1] dark:border-[#1A364E] gap-1">
            <button
              type="button"
              onClick={() => cambiarModo('OFICIAL')}
              data-testid="btn-modo-oficial"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                modo === 'OFICIAL'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-[#334155] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Precio Oficial</span>
            </button>

            <button
              type="button"
              onClick={() => cambiarModo('EN_VIVO')}
              data-testid="btn-modo-envivo"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                modo === 'EN_VIVO'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-[#334155] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Precio En Vivo</span>
            </button>

            <button
              type="button"
              onClick={() => cambiarModo('MANUAL')}
              data-testid="btn-modo-manual"
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                modo === 'MANUAL'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-[#334155] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Precio Manual (Escribir)</span>
            </button>
          </div>

          {modo !== 'OFICIAL' && (
            <button
              type="button"
              onClick={restaurarOficial}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F1F5F9] dark:bg-[#0F2232] border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#0891B2] transition"
              title="Volver a la tabla oficial de la quincena"
            >
              <RotateCcw className="w-4 h-4 text-[#0891B2] dark:text-[#06B6D4]" />
              <span>Volver a Oficial</span>
            </button>
          )}
        </div>
      </div>

      {mensajeNotif && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{mensajeNotif}</span>
          </div>
          <button onClick={() => setMensajeNotif('')}>
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Panel de Tipo de Cambio del Dólar: BCB Valor Referencial vs Dólar Paralelo */}
      <div
        data-testid="panel-dolar-bcb-paralelo"
        className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Tipo de Cambio del Dólar (BCB y Dólar Paralelo): <span className="text-emerald-600 dark:text-emerald-400 font-mono-num">{formatearNumeroBolivia(tipoCambio, 2)} Bs / $US</span>
              </h2>
              <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {dolarInfo?.fuenteActiva || 'Dólar Paralelo Bolivia'}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={cambiandoDolar}
            onClick={() => cambiarDolar('PARALELO', true)}
            data-testid="btn-sync-dolar-envivo"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition disabled:opacity-60"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>{cambiandoDolar ? 'Actualizando...' : 'Actualizar Dólar Paralelo En Vivo'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Opción 1: Dólar Paralelo */}
          <button
            type="button"
            onClick={() => cambiarDolar('PARALELO')}
            data-testid="btn-dolar-paralelo"
            className={`text-left p-4 rounded-xl border card-interactive btn-tactile cursor-pointer ${
              (dolarInfo?.modoDolar || 'PARALELO') === 'PARALELO'
                ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-500 ring-2 ring-emerald-500/30'
                : 'bg-[#F8FAFC] dark:bg-[#060D14] border-[#CBD5E1] dark:border-[#1A364E] hover:border-emerald-500/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Dólar Paralelo (Mercado)</span>
              {(dolarInfo?.modoDolar || 'PARALELO') === 'PARALELO' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">ACTIVO</span>
              )}
            </div>
            <div className="text-2xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-1">
              {formatearNumeroBolivia(dolarInfo?.paralelo?.promedio ?? 11.92, 2)} Bs
            </div>
            <div className="text-[11px] font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-1">
              Compra: {formatearNumeroBolivia(dolarInfo?.paralelo?.compra ?? 11.85, 2)} · Venta: {formatearNumeroBolivia(dolarInfo?.paralelo?.venta ?? 11.97, 2)}
            </div>
          </button>

          {/* Opción 2: BCB Valor Referencial */}
          <button
            type="button"
            onClick={() => cambiarDolar('BCB_REFERENCIAL')}
            data-testid="btn-dolar-bcb-ref"
            className={`text-left p-4 rounded-xl border card-interactive btn-tactile cursor-pointer ${
              dolarInfo?.modoDolar === 'BCB_REFERENCIAL'
                ? 'bg-cyan-50 dark:bg-cyan-950/35 border-cyan-500 ring-2 ring-cyan-500/30'
                : 'bg-[#F8FAFC] dark:bg-[#060D14] border-[#CBD5E1] dark:border-[#1A364E] hover:border-cyan-500/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">Valor Referencial BCB</span>
              {dolarInfo?.modoDolar === 'BCB_REFERENCIAL' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-600 text-white">ACTIVO</span>
              )}
            </div>
            <div className="text-2xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-1">
              {formatearNumeroBolivia(dolarInfo?.bcbReferencial?.venta ?? 11.7, 2)} Bs
            </div>
            <div className="text-[11px] font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-1">
              Compra: {formatearNumeroBolivia(dolarInfo?.bcbReferencial?.compra ?? 11.58, 2)} · Venta: {formatearNumeroBolivia(dolarInfo?.bcbReferencial?.venta ?? 11.7, 2)}
            </div>
          </button>

          {/* Opción 3: BCB Oficial Nominal */}
          <button
            type="button"
            onClick={() => cambiarDolar('BCB_OFICIAL')}
            data-testid="btn-dolar-bcb-oficial"
            className={`text-left p-4 rounded-xl border card-interactive btn-tactile cursor-pointer ${
              dolarInfo?.modoDolar === 'BCB_OFICIAL'
                ? 'bg-indigo-50 dark:bg-indigo-950/35 border-indigo-500 ring-2 ring-indigo-500/30'
                : 'bg-[#F8FAFC] dark:bg-[#060D14] border-[#CBD5E1] dark:border-[#1A364E] hover:border-indigo-500/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">BCB Oficial (Fijo)</span>
              {dolarInfo?.modoDolar === 'BCB_OFICIAL' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">ACTIVO</span>
              )}
            </div>
            <div className="text-2xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-1">
              {formatearNumeroBolivia(dolarInfo?.bcbOficial?.venta ?? 6.96, 2)} Bs
            </div>
            <div className="text-[11px] font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-1">
              Compra: {formatearNumeroBolivia(dolarInfo?.bcbOficial?.compra ?? 6.86, 2)} · Venta: {formatearNumeroBolivia(dolarInfo?.bcbOficial?.venta ?? 6.96, 2)}
            </div>
          </button>

          {/* Opción 4: Dólar Manual */}
          <div
            className={`p-4 rounded-xl border transition ${
              dolarInfo?.modoDolar === 'MANUAL'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/30'
                : 'bg-[#F8FAFC] dark:bg-[#060D14] border-[#CBD5E1] dark:border-[#1A364E]'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Escribir Cambio Manual</span>
              {dolarInfo?.modoDolar === 'MANUAL' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">ACTIVO</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="number"
                step="0.01"
                value={tcManualInput}
                onChange={(e) => setTcManualInput(e.target.value)}
                data-testid="input-dolar-manual"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] font-mono-num font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]"
              />
              <button
                type="button"
                onClick={() => cambiarDolar('MANUAL')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0"
              >
                Aplicar
              </button>
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
              Se aplica en Bs a todos los cálculos
            </div>
          </div>
        </div>
      </div>

      {/* 4 Tarjetas KPI de Referencia Rápida (Oro, Estaño, Plata, Zinc) con Bordes de Color */}
      {kpiDestacados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiDestacados.map((kpi) => (
            <div
              key={kpi.id}
              className={`bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] ${bordeKpiPorSimbolo[kpi.simbolo] || 'border-t-4 border-t-cyan-400'} rounded-2xl p-4 shadow-sm transition-colors flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono-num font-bold text-xs text-white ${colorIconoMineral[kpi.simbolo] || 'bg-cyan-600'
                      }`}
                  >
                    {kpi.simbolo}
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                      {kpi.mineral}
                    </div>
                    <div className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8]">
                      Por {kpi.unidadNombre} ({kpi.unidad})
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => iniciarEdicion(kpi)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 border border-amber-500/30 transition"
                  title={`Cambiar el precio de ${kpi.mineral}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Cambiar</span>
                </button>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                  ${formatearNumeroBolivia(kpi.cotizacionUsd, 2)}
                </span>
                <span className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8]">
                  {formatearNumeroBolivia(kpi.cotizacionBob, 2)} Bs
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid: 8 cols Tabla de Cotizaciones + 4 cols Simulador de Valorización */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Tabla Oficial Exacta y Filtros */}
        <div className="lg:col-span-8 space-y-4">
          {/* Barra de Filtros por Categoría Minera y Búsqueda */}
          <div className="bg-[#FFFFFF] dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-4 shadow-sm space-y-3 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'TODOS', label: 'Todos (13)' },
                  { id: 'PRECIOSOS', label: 'Preciosos (Oro, Plata)' },
                  { id: 'BASICOS', label: 'Básicos (Estaño, Zinc, Plomo, Cobre)' },
                  { id: 'ESTRATEGICOS', label: 'Estratégicos (Wolfram, Sb, Bi)' },
                  { id: 'NO_METALICOS', label: 'No Metálicos (Caliza)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoriaFiltro(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${categoriaFiltro === cat.id
                        ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white'
                        : 'bg-[#F1F5F9] dark:bg-[#060D14] text-[#334155] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar mineral, símbolo o unidad..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0891B2]"
                />
              </div>
            </div>
          </div>

          {/* Tabla oficial del Ministerio de Minería con edición manual */}
          <div className="bg-[#FFFFFF] dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden transition-colors">
            <div className="bg-gradient-to-r from-[#071320] via-[#0F2232] to-[#16364D] border-b border-[#06B6D4]/40 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold uppercase tracking-wider text-[#22D3EE]">
                  COTIZACIONES OFICIALES
                </h2>
                <div className="text-[11px] font-mono-num text-slate-300 mt-0.5">
                  {quincena} · Tipo de Cambio Activo: {formatearNumeroBolivia(tipoCambio, 2)} Bs/$US ({dolarInfo?.modoDolar || 'PARALELO'})
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono-num font-bold px-2 py-0.5 rounded-full ${modo === 'OFICIAL'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : modo === 'EN_VIVO'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}>
                  MODO: {modo}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-[#1A364E] bg-white dark:bg-[#0A1622] shadow-xs">
              <table className="w-full text-left table-excel">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#0D1D2C] border-b-2 border-slate-300 dark:border-[#244869] text-xs font-bold text-slate-700 dark:text-[#94A3B8]">
                    <th className="py-2.5 px-3 border-r border-slate-300 dark:border-[#1A364E]">Mineral</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-[#1A364E]">Unid.</th>
                    <th className="py-2.5 px-3 text-right bg-amber-500/10 text-amber-900 dark:text-amber-200 font-extrabold border-r border-slate-300 dark:border-[#1A364E]">
                      Cotización $US
                    </th>
                    <th className="py-2.5 px-3 text-right font-mono-num border-r border-slate-300 dark:border-[#1A364E]">Cotización Bs</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-[#1A364E]">Regalía (Ley 535)</th>
                    <th className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-[#1A364E]">Origen</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CBD5E1]/60 dark:divide-[#1A364E]/60 text-xs text-[#0F172A] dark:text-[#F8FAFC]">
                  {cotizacionesFiltradas.map((item) => {
                    const esEditando = editandoId === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#F1F5F9]/80 dark:hover:bg-[#0F2232]/80 transition ${item.simbolo === 'Au' ? 'bg-amber-500/5' : ''
                          }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono-num font-bold text-[10px] text-white shrink-0 ${colorIconoMineral[item.simbolo] || 'bg-slate-600'
                                }`}
                            >
                              {item.simbolo}
                            </span>
                            <div>
                              <div className="font-extrabold flex items-center gap-1.5">
                                <span>{item.mineral}</span>
                              </div>
                              {item.subtipo && (
                                <div className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8] tracking-wider">
                                  {item.subtipo}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center font-mono-num font-bold text-[#0891B2] dark:text-[#06B6D4]">
                          {item.unidad}
                        </td>

                        {/* Cotización $US editable */}
                        <td className="py-3 px-4 text-right font-mono-num font-extrabold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                          {esEditando ? (
                            <div className="inline-flex items-center gap-1 justify-end">
                              <span className="text-xs text-[#64748B]">$</span>
                              <input
                                type="number"
                                step="any"
                                value={valorEditUsd}
                                onChange={(e) => setValorEditUsd(e.target.value)}
                                className="w-24 px-2 py-1 text-right text-xs bg-white dark:bg-[#060D14] border-2 border-[#0891B2] dark:border-[#06B6D4] rounded-lg font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <span>{formatearNumeroBolivia(item.cotizacionUsd, 2)}</span>
                              {item.variacionPct !== undefined && item.variacionPct !== 0 && (
                                <span
                                  className={`text-[10px] font-bold ${item.variacionPct > 0 ? 'text-emerald-500' : 'text-rose-500'
                                    }`}
                                >
                                  {item.variacionPct > 0 ? '▲' : '▼'}
                                  {Math.abs(item.variacionPct)}%
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono-num text-[#334155] dark:text-[#94A3B8]">
                          {esEditando
                            ? formatearNumeroBolivia((parseFloat(valorEditUsd) || 0) * tipoCambio, 2)
                            : formatearNumeroBolivia(item.cotizacionBob, 2)}{' '}
                          Bs
                        </td>

                        <td className="py-3 px-3 text-center font-mono-num font-bold text-amber-600 dark:text-amber-400">
                          {esEditando ? (
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={alicuotaEdit}
                              onChange={(e) => setAlicuotaEdit(e.target.value)}
                              className="w-16 px-2 py-1 text-center text-xs bg-white dark:bg-[#060D14] border border-[#0891B2] dark:border-[#06B6D4] rounded-lg font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]"
                              aria-label="Alícuota Regalía (%)"
                            />
                          ) : (
                            `${item.alicuotaRegalia.toFixed(1)}%`
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${item.origen === 'OFICIAL'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : item.origen === 'EN_VIVO'
                                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              }`}
                          >
                            {item.origen}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {esEditando ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => guardarEdicionManual(item.id)}
                                disabled={guardando}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                title="Guardar valor manual"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditandoId(null)}
                                className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(item)}
                              data-testid={`btn-editar-cot-${item.simbolo}`}
                              className="p-1.5 rounded-lg text-[#0891B2] dark:text-[#06B6D4] hover:bg-[#F1F5F9] dark:hover:bg-[#060D14]"
                              title="Editar cotización manualmente"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Calculadora Fácil de Valor de Lote */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#FFFFFF] dark:bg-[#0A1622] border-2 border-emerald-500/60 dark:border-emerald-500/50 rounded-2xl p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-[#CBD5E1] dark:border-[#1A364E] pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0F172A] dark:text-[#F8FAFC]">
                  Calculadora Fácil de Lote
                </h3>
              </div>
              <span className="text-[10px] font-mono-num font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                Con Regalía
              </span>
            </div>

            <p className="text-xs text-[#334155] dark:text-[#CBD5E1]">
              Calcula cuánto vale cualquier lote de mineral al instante:
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  1. Elige el mineral
                </label>
                <select
                  value={simuladorMineralId}
                  onChange={(e) => setSimuladorMineralId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC] font-bold"
                >
                  {cotizaciones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.mineral} ({c.simbolo}) — {c.cotizacionUsd} $US/{c.unidad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                    2. Peso del lote (kg)
                  </label>
                  <input
                    type="number"
                    value={simPesoKg}
                    onChange={(e) => setSimPesoKg(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC] font-mono-num font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                    3. Ley del mineral (% o g/t)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={simLey}
                    onChange={(e) => setSimLey(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC] font-mono-num font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                    4. Precio a usar ($US)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={simPrecioManual}
                    onChange={(e) => setSimPrecioManual(e.target.value)}
                    data-testid="input-sim-precio-manual"
                    className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-amber-500/60 rounded-xl text-amber-600 dark:text-amber-300 font-mono-num font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                    5. Descuento maquila ($US)
                  </label>
                  <input
                    type="number"
                    value={simMaquilaUsd}
                    onChange={(e) => setSimMaquilaUsd(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC] font-mono-num font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Resultados del Desglose */}
            {simResultado && (
              <div className="pt-3 border-t border-[#CBD5E1] dark:border-[#1A364E] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Mineral puro contenido:</span>
                  <span className="font-mono-num font-bold text-cyan-600 dark:text-cyan-400">
                    {simResultado.pesoFinoEnUnidad} {simResultado.unidad}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B] dark:text-[#94A3B8]">Valor total antes de descuentos:</span>
                  <span className="font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    ${formatearNumeroBolivia(simResultado.valorBrutoUsd, 2)} ({formatearNumeroBolivia(simResultado.valorBrutoBob, 2)} Bs)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                  <span>Descuento Regalía ({simResultado.alicuota}%):</span>
                  <span className="font-mono-num font-bold">
                    -${formatearNumeroBolivia(simResultado.regaliaUsd, 2)} ({formatearNumeroBolivia(simResultado.regaliaBob, 2)} Bs)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-500/40">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                    MONTO FINAL ESTIMADO A PAGAR
                  </span>
                  <div className="text-2xl font-mono-num font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    ${formatearNumeroBolivia(simResultado.valorNetoUsd, 2)} USD
                  </div>
                  <div className="text-xs font-mono-num text-emerald-700 dark:text-emerald-200 mt-0.5">
                    {formatearNumeroBolivia(simResultado.valorNetoBob, 2)} Bs (TC: {formatearNumeroBolivia(tipoCambio, 2)} Bs)
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-4 text-xs text-[#64748B] dark:text-[#94A3B8] space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              <Info className="w-4 h-4 text-cyan-500" />
              <span>¿Para qué sirven estos precios?</span>
            </div>
            <p>
              Estos precios quincenales oficiales sirven de base en Bolivia para calcular liquidaciones y descuentos de regalía minera. Puedes cambiarlos manualmente arriba si pactaste otro precio con tu comprador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
