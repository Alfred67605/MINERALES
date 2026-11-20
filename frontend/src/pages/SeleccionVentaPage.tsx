import React, { useEffect, useState, useMemo, useRef, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Square,
  Search,
  Filter,
  RotateCcw,
  Trash2,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  X,
  Scale,
  Package,
  Layers,
  Calculator,
  Sparkles,
  Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  COTIZACIONES_OFICIALES_FALLBACK,
  CotizacionReferencia,
  LoteItem,
  TIPO_CAMBIO_OFICIAL_BOB,
  calcularResumenEnTiempoReal,
  calcularValorizacionGrupo,
  calcularValorizacionLote,
  formatearEnteroBolivia,
  formatearFechaBolivia,
  formatearMonedaBob,
  formatearMonedaUsd,
  formatearNumeroBolivia,
} from '../utils/calculations';
import { EmptyStateMineralSvg } from '../components/MineralGraphics';

export function SeleccionVentaPage() {
  const { tienePermiso } = useAuth();
  const puedeConfirmarVenta = tienePermiso('ADMINISTRADOR', 'VENDEDOR');
  const navigate = useNavigate();

  const [lotesDisponibles, setLotesDisponibles] = useState<LoteItem[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [compradores, setCompradores] = useState<any[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionReferencia[]>(COTIZACIONES_OFICIALES_FALLBACK);
  const [tipoCambio, setTipoCambio] = useState<number>(TIPO_CAMBIO_OFICIAL_BOB);
  const [cargando, setCargando] = useState(true);

  const [seleccionadosSet, setSeleccionadosSet] = useState<Set<string>>(new Set());
  const [mapaLotesPorId, setMapaLotesPorId] = useState<Map<string, LoteItem>>(new Map());
  const ultimoIdClicadoRef = useRef<string | null>(null);

  // Filtros
  const [q, setQ] = useState('');
  const deferredQ = useDeferredValue(q);
  const [proveedorId, setProveedorId] = useState('');
  const [minaOrigen, setMinaOrigen] = useState('');
  const [tipoMineral, setTipoMineral] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // Modo: VER SOLO SELECCIONADOS
  const [verSoloSeleccionados, setVerSoloSeleccionados] = useState(false);

  // Criterio de ponderación: Peso Neto Húmedo (compatible por defecto) vs Peso Neto Seco
  const [usarPesoSeco, setUsarPesoSeco] = useState(false);

  // Paginación
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [decimalesFormato, setDecimalesFormato] = useState(2);

  // Modal de Confirmación y Cierre de Venta (Módulo 6)
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
  const [compradorId, setCompradorId] = useState('');
  const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().slice(0, 10));
  const [expedienteM02Venta, setExpedienteM02Venta] = useState('M02-VTA-2026-0003');
  const [observacionesVenta, setObservacionesVenta] = useState('');
  const [idempotencyKeyActual, setIdempotencyKeyActual] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [errorVenta, setErrorVenta] = useState('');
  const [ventaExitosa, setVentaExitosa] = useState<any | null>(null);

  const cargarLotesDisponibles = async () => {
    setCargando(true);
    try {
      const [resLotes, resProv, resComp, resCot] = await Promise.all([
        apiFetch<{ lotes: LoteItem[] }>('/api/lotes?estado=DISPONIBLE'),
        apiFetch<{ proveedores: any[] }>('/api/proveedores?estado=ACTIVO'),
        apiFetch<{ compradores: any[] }>('/api/compradores?estado=ACTIVO'),
        apiFetch<{ cotizaciones: CotizacionReferencia[]; tipoCambioBobUsd?: number }>('/api/cotizaciones').catch(
          () => ({ cotizaciones: COTIZACIONES_OFICIALES_FALLBACK, tipoCambioBobUsd: TIPO_CAMBIO_OFICIAL_BOB })
        ),
      ]);

      setLotesDisponibles(resLotes.lotes);
      setProveedores(resProv.proveedores);
      setCompradores(resComp.compradores);
      if (resCot.cotizaciones?.length) setCotizaciones(resCot.cotizaciones);
      if (resCot.tipoCambioBobUsd) setTipoCambio(resCot.tipoCambioBobUsd);
      if (resComp.compradores.length > 0 && !compradorId) {
        setCompradorId(resComp.compradores[0].id);
      }

      const nuevoMapa = new Map<string, LoteItem>();
      for (const l of resLotes.lotes) {
        nuevoMapa.set(l.id, l);
      }
      setMapaLotesPorId(nuevoMapa);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarLotesDisponibles();
  }, []);

  const lotesFiltrados = useMemo(() => {
    return lotesDisponibles.filter((lote) => {
      if (verSoloSeleccionados && !seleccionadosSet.has(lote.id)) {
        return false;
      }
      if (proveedorId && lote.proveedorId !== proveedorId) {
        return false;
      }
      if (
        minaOrigen.trim() &&
        !lote.minaOrigen?.toLowerCase().includes(minaOrigen.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        tipoMineral.trim() &&
        !lote.tipoMineral.toLowerCase().includes(tipoMineral.trim().toLowerCase())
      ) {
        return false;
      }
      if (desde) {
        const fLote = lote.fechaCompra.slice(0, 10);
        if (fLote < desde) return false;
      }
      if (hasta) {
        const fLote = lote.fechaCompra.slice(0, 10);
        if (fLote > hasta) return false;
      }
      if (deferredQ.trim()) {
        const term = deferredQ.trim().toLowerCase();
        const coincide =
          lote.numeroLote.toLowerCase().includes(term) ||
          lote.proveedorNombre.toLowerCase().includes(term) ||
          lote.minaOrigen.toLowerCase().includes(term) ||
          lote.tipoMineral.toLowerCase().includes(term);
        if (!coincide) return false;
      }
      return true;
    });
  }, [
    lotesDisponibles,
    verSoloSeleccionados,
    seleccionadosSet,
    proveedorId,
    minaOrigen,
    tipoMineral,
    desde,
    hasta,
    deferredQ,
  ]);

  const totalPaginas = Math.max(1, Math.ceil(lotesFiltrados.length / porPagina));
  const lotesVisiblesEnPagina = useMemo(() => {
    const start = (pagina - 1) * porPagina;
    return lotesFiltrados.slice(start, start + porPagina);
  }, [lotesFiltrados, pagina, porPagina]);

  const listaLotesSeleccionados = useMemo(() => {
    const arr: LoteItem[] = [];
    for (const id of seleccionadosSet) {
      const item = mapaLotesPorId.get(id);
      if (item) arr.push(item);
    }
    return arr;
  }, [seleccionadosSet, mapaLotesPorId]);

  const resumenTiempoReal = useMemo(() => {
    return calcularResumenEnTiempoReal(
      listaLotesSeleccionados,
      decimalesFormato,
      usarPesoSeco
    );
  }, [listaLotesSeleccionados, decimalesFormato, usarPesoSeco]);

  const valorizacionSeleccion = useMemo(() => {
    return calcularValorizacionGrupo(
      listaLotesSeleccionados,
      cotizaciones,
      usarPesoSeco,
      tipoCambio
    );
  }, [listaLotesSeleccionados, cotizaciones, usarPesoSeco, tipoCambio]);

  const manejarClicFila = (
    loteId: string,
    evento: React.MouseEvent<HTMLInputElement | HTMLTableRowElement | HTMLButtonElement>
  ) => {
    const conShift = Boolean(evento.shiftKey);
    const idAnterior = ultimoIdClicadoRef.current;
    ultimoIdClicadoRef.current = loteId;

    setSeleccionadosSet((prev) => {
      const nuevo = new Set(prev);

      if (conShift && idAnterior && idAnterior !== loteId) {
        const idxInicio = lotesFiltrados.findIndex((l) => l.id === idAnterior);
        const idxFin = lotesFiltrados.findIndex((l) => l.id === loteId);

        if (idxInicio !== -1 && idxFin !== -1) {
          const minIdx = Math.min(idxInicio, idxFin);
          const maxIdx = Math.max(idxInicio, idxFin);
          for (let i = minIdx; i <= maxIdx; i++) {
            nuevo.add(lotesFiltrados[i].id);
          }
          return nuevo;
        }
      }

      if (nuevo.has(loteId)) {
        nuevo.delete(loteId);
      } else {
        nuevo.add(loteId);
      }

      return nuevo;
    });
  };

  const todosVisiblesSeleccionados =
    lotesVisiblesEnPagina.length > 0 &&
    lotesVisiblesEnPagina.every((l) => seleccionadosSet.has(l.id));

  const toggleSeleccionarVisibles = () => {
    setSeleccionadosSet((prev) => {
      const nuevo = new Set(prev);
      if (todosVisiblesSeleccionados) {
        for (const l of lotesVisiblesEnPagina) {
          nuevo.delete(l.id);
        }
      } else {
        for (const l of lotesVisiblesEnPagina) {
          nuevo.add(l.id);
        }
      }
      return nuevo;
    });
  };

  const seleccionarTodosLosFiltrados = () => {
    setSeleccionadosSet((prev) => {
      const nuevo = new Set(prev);
      for (const l of lotesFiltrados) {
        nuevo.add(l.id);
      }
      return nuevo;
    });
  };

  const seleccionarCantidadRapida = (cantidad: number) => {
    setSeleccionadosSet(() => {
      const nuevo = new Set<string>();
      const limite = Math.min(cantidad, lotesFiltrados.length);
      for (let i = 0; i < limite; i++) {
        nuevo.add(lotesFiltrados[i].id);
      }
      return nuevo;
    });
  };

  const limpiarSeleccion = () => {
    setSeleccionadosSet(new Set());
    setVerSoloSeleccionados(false);
    ultimoIdClicadoRef.current = null;
  };

  const quitarLoteDeSeleccion = (id: string) => {
    setSeleccionadosSet((prev) => {
      const nuevo = new Set(prev);
      nuevo.delete(id);
      if (nuevo.size === 0) {
        setVerSoloSeleccionados(false);
      }
      return nuevo;
    });
  };

  const restaurarFiltros = () => {
    setQ('');
    setProveedorId('');
    setMinaOrigen('');
    setTipoMineral('');
    setDesde('');
    setHasta('');
    setVerSoloSeleccionados(false);
    setPagina(1);
  };

  const ejecutarConfirmacionVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmando || listaLotesSeleccionados.length === 0) return;

    setConfirmando(true);
    setErrorVenta('');
    try {
      const res = await apiFetch('/api/ventas', {
        method: 'POST',
        headers: {
          'x-idempotency-key': idempotencyKeyActual,
        },
        body: JSON.stringify({
          idempotencyKey: idempotencyKeyActual,
          fecha: fechaVenta,
          compradorId,
          loteIds: listaLotesSeleccionados.map((l) => l.id),
          expedienteM02: expedienteM02Venta,
          observaciones: observacionesVenta,
          usarPesoSeco,
        }),
      });

      setVentaExitosa(res.venta);
      setModalConfirmarAbierto(false);
      setSeleccionadosSet(new Set());
      setVerSoloSeleccionados(false);
      await cargarLotesDisponibles();
    } catch (err: any) {
      setErrorVenta(
        err.message || 'Ocurrió un conflicto al intentar cerrar la venta. Verifique los lotes.'
      );
    } finally {
      setConfirmando(false);
    }
  };

  const textoLeyBarraResumen = useMemo(() => {
    if (resumenTiempoReal.promediosLeyes.length === 0) return 'Sin selección';
    return resumenTiempoReal.promediosLeyes
      .map(
        (pl) =>
          `${pl.simbolo}: ${formatearNumeroBolivia(pl.leyPromedioRedondeada, decimalesFormato)} ${
            pl.unidadMedida
          }`
      )
      .join(' · ');
  }, [resumenTiempoReal, decimalesFormato]);

  return (
    <div className="space-y-6 pb-36">
      {/* Cabecera Venta de Lotes */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
            Vender Lotes
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Selector de base de ponderación: Peso Neto Húmedo vs Peso Seco */}
          <button
            type="button"
            onClick={() => setUsarPesoSeco((v) => !v)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC]"
            title="Alternar base de ponderación de leyes (Peso Húmedo vs Peso Seco ISO 10251)"
          >
            Base: {usarPesoSeco ? 'Peso Seco (ISO 10251)' : 'Peso Neto Húmedo'}
          </button>

          <div className="flex items-center gap-1.5 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl px-3 py-1.5 text-xs">
            <Calculator className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#06B6D4]" />
            <span className="text-[#334155] dark:text-[#94A3B8] font-medium">Decimales:</span>
            <select
              value={decimalesFormato}
              onChange={(e) => setDecimalesFormato(Number(e.target.value))}
              className="font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC] bg-transparent focus:outline-none"
              aria-label="Precisión decimal mostrada"
            >
              <option value={2}>2 dec.</option>
              <option value={3}>3 dec.</option>
              <option value={4}>4 dec.</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setVerSoloSeleccionados((v) => !v)}
            data-testid="btn-ver-solo-seleccionados"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
              verSoloSeleccionados
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white border-[#0891B2] dark:border-[#06B6D4] shadow-sm'
                : 'bg-white dark:bg-[#0A1622] text-[#0891B2] dark:text-[#06B6D4] border-[#0891B2] dark:border-[#06B6D4] hover:bg-cyan-50 dark:hover:bg-cyan-950/40'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>
              {verSoloSeleccionados
                ? `MOSTRAR TODOS (${lotesDisponibles.length})`
                : `VER SOLO SELECCIONADOS (${seleccionadosSet.size})`}
            </span>
          </button>
        </div>
      </div>

      {/* Confirmación de éxito cuando se acaba de cerrar una venta */}
      <AnimatePresence>
        {ventaExitosa && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-cyan-50 dark:bg-[#06B6D4]/15 border-2 border-[#0891B2] dark:border-[#06B6D4] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#0891B2] dark:text-[#22D3EE] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-[#0891B2] dark:text-[#22D3EE]">
                  ¡Venta {ventaExitosa.numeroVenta} registrada y cerrada con éxito!
                </h3>
                <p className="text-xs text-slate-900 dark:text-[#F8FAFC] mt-0.5">
                  Comprador: <strong>{ventaExitosa.compradorNombre}</strong> ·{' '}
                  <strong>{ventaExitosa.totalLotes} lotes</strong> ({ventaExitosa.totalSacos} sacos ·{' '}
                  {formatearNumeroBolivia(ventaExitosa.pesoTotalKg, 2)} kg) pasaron a estado{' '}
                  <strong>VENDIDO</strong> y fueron retirados del almacén disponible.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/historial-ventas')}
                className="px-4 py-2 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] text-white text-xs font-bold"
              >
                Ver en Historial de Ventas
              </button>
              <button
                onClick={() => setVentaExitosa(null)}
                className="p-1.5 text-[#0891B2] dark:text-[#22D3EE]"
                aria-label="Cerrar confirmación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Liquidación Estimada en Bolivianos (Bs) y Detalle por Saco */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E2E8F0] dark:border-[#152E42]">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Cálculo de Venta en Bolivianos (TC: {tipoCambio} Bs/$US)
            </h2>
          </div>
          <span className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8]">
            {seleccionadosSet.size > 0
              ? `${valorizacionSeleccion.totalLotes} lotes · ${formatearEnteroBolivia(valorizacionSeleccion.totalSacos)} sacos (${formatearNumeroBolivia(valorizacionSeleccion.pesoPromedioPorSacoKg, 1)} kg/saco)`
              : 'Marca lotes abajo para calcular cuánto recibirás en Bs y por saco'}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-[#E2E8F0] dark:border-[#152E42] card-interactive">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] block">Sacos y Peso / Saco</span>
            <span className="text-lg font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {formatearEnteroBolivia(valorizacionSeleccion.totalSacos)} sacos
            </span>
            <span className="text-xs font-mono-num text-violet-600 dark:text-violet-400 block">
              {formatearNumeroBolivia(valorizacionSeleccion.pesoPromedioPorSacoKg, 2)} kg / saco
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-[#E2E8F0] dark:border-[#152E42] card-interactive">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] block">Valor Bruto</span>
            <span className="text-lg font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {formatearMonedaBob(valorizacionSeleccion.valorBrutoTotalBob)}
            </span>
            <span className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] block">
              {formatearMonedaUsd(valorizacionSeleccion.valorBrutoTotalUsd)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-[#E2E8F0] dark:border-[#152E42] card-interactive">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] block">Regalía Minera (Ley 535)</span>
            <span className="text-lg font-mono-num font-bold text-rose-600 dark:text-rose-400">
              - {formatearMonedaBob(valorizacionSeleccion.regaliaTotalBob)}
            </span>
            <span className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] block">
              - {formatearMonedaUsd(valorizacionSeleccion.regaliaTotalUsd)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/40 card-interactive">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 block">Total a Recibir (Bs)</span>
            <span className="text-xl font-mono-num font-extrabold text-emerald-700 dark:text-emerald-300" data-testid="resumen-total-bs">
              {formatearMonedaBob(valorizacionSeleccion.valorNetoTotalBob)}
            </span>
            <span className="text-xs font-mono-num text-emerald-700/80 dark:text-emerald-200/80 block">
              {formatearMonedaUsd(valorizacionSeleccion.valorNetoTotalUsd)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-500/40 card-interactive">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">Promedio por Saco / Lote</span>
            <span className="text-lg font-mono-num font-extrabold text-amber-700 dark:text-amber-300" data-testid="resumen-bs-saco">
              {formatearMonedaBob(valorizacionSeleccion.valorPromedioPorSacoBob)} / saco
            </span>
            <span className="text-xs font-mono-num text-amber-700/80 dark:text-amber-200/80 block">
              {formatearMonedaBob(valorizacionSeleccion.valorPromedioPorLoteBob)} / lote
            </span>
          </div>
        </div>
      </div>

      {/* Filtros de búsqueda y Acciones Masivas */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-4 shadow-2xs space-y-3">
        {/* Píldoras de Filtro Rápido Inteligente */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-[#1A364E]/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
            Filtros Directos:
          </span>
          <button
            type="button"
            onClick={() => {
              setQ('');
              setTipoMineral('');
              setProveedorId('');
              setMinaOrigen('');
              setPagina(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              !q && !tipoMineral && !proveedorId && !minaOrigen
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white'
                : 'bg-slate-50 dark:bg-[#060D14] text-slate-600 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-[#162E44]'
            }`}
          >
            Todos ({lotesDisponibles.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTipoMineral('Estaño');
              setQ('');
              setPagina(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              tipoMineral === 'Estaño'
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white'
                : 'bg-slate-50 dark:bg-[#060D14] text-[#0891B2] dark:text-[#22D3EE] hover:bg-cyan-50 dark:hover:bg-[#06B6D4]/15 border border-[#0891B2]/30 dark:border-[#06B6D4]/30'
            }`}
          >
            Estaño (Sn)
          </button>
          <button
            type="button"
            onClick={() => {
              setTipoMineral('Complejo');
              setQ('');
              setPagina(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              tipoMineral === 'Complejo'
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white'
                : 'bg-slate-50 dark:bg-[#060D14] text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/15 border border-amber-500/30'
            }`}
          >
            Complejo Pb-Ag-Zn
          </button>
          <button
            type="button"
            onClick={() => {
              setMinaOrigen('Potosí');
              setPagina(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              minaOrigen === 'Potosí'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-50 dark:bg-[#060D14] text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/15 border border-amber-500/40'
            }`}
          >
            Cerro Rico / Potosí
          </button>
          <button
            type="button"
            onClick={() => {
              setMinaOrigen('Huanuni');
              setPagina(1);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              minaOrigen === 'Huanuni'
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white'
                : 'bg-slate-50 dark:bg-[#060D14] text-slate-600 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-[#162E44]'
            }`}
          >
            Huanuni / Oruro
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
              Buscar por N.º de lote o texto
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPagina(1);
                }}
                placeholder="Ej. LT-2026-0101, Huanuni, Complejo..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl focus:outline-none focus:border-[#0891B2] dark:focus:border-[#06B6D4]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
              Proveedor
            </label>
            <select
              value={proveedorId}
              onChange={(e) => {
                setProveedorId(e.target.value);
                setPagina(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
              Mina de Origen
            </label>
            <input
              type="text"
              value={minaOrigen}
              onChange={(e) => {
                setMinaOrigen(e.target.value);
                setPagina(1);
              }}
              placeholder="Ej. Cerro Rico, Colquiri..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
              Tipo de Mineral
            </label>
            <input
              type="text"
              value={tipoMineral}
              onChange={(e) => {
                setTipoMineral(e.target.value);
                setPagina(1);
              }}
              placeholder="Ej. Complejo Zn-Ag, Estaño..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex-1">
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
                Desde / Hasta
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => {
                    setDesde(e.target.value);
                    setPagina(1);
                  }}
                  className="w-1/2 px-2 py-2 text-[11px] bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-lg"
                />
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => {
                    setHasta(e.target.value);
                    setPagina(1);
                  }}
                  className="w-1/2 px-2 py-2 text-[11px] bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-lg"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={restaurarFiltros}
              title="Restaurar filtros"
              className="p-2 rounded-xl border border-slate-200 dark:border-[#1A364E] text-slate-600 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-[#162E44] mt-5"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Acciones Masivas */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#1A364E] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSeleccionarVisibles}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0D1D2C] hover:bg-slate-200 dark:hover:bg-[#162E44] text-slate-900 dark:text-[#F8FAFC] font-semibold transition"
            >
              {todosVisiblesSeleccionados
                ? `Deseleccionar página visible (${lotesVisiblesEnPagina.length})`
                : `Seleccionar todos los visibles (${lotesVisiblesEnPagina.length})`}
            </button>

            <button
              type="button"
              onClick={seleccionarTodosLosFiltrados}
              data-testid="btn-seleccionar-todos-filtrados"
              className="px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-[#06B6D4]/15 hover:bg-cyan-100 dark:hover:bg-[#06B6D4]/25 text-[#0891B2] dark:text-[#22D3EE] font-bold border border-[#0891B2]/30 dark:border-[#06B6D4]/30 transition"
            >
              Seleccionar todos los resultados filtrados ({lotesFiltrados.length})
            </button>

            <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-[#1A364E]">
              <span className="text-[11px] text-slate-500 dark:text-[#94A3B8] font-semibold mr-1">
                Agrupación rápida:
              </span>
              {[10, 20, 40].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => seleccionarCantidadRapida(num)}
                  data-testid={`btn-seleccionar-${num}`}
                  className="px-2.5 py-1 rounded-md font-mono-num font-bold bg-slate-50 dark:bg-[#060D14] hover:bg-[#0e7490] dark:hover:bg-[#22D3EE] hover:text-white border border-[#0891B2]/50 dark:border-[#06B6D4]/50 text-slate-900 dark:text-[#F8FAFC] transition"
                >
                  {num} lotes
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE]" data-testid="contador-seleccionados">
              {seleccionadosSet.size} lote(s) seleccionado(s)
            </span>
            {seleccionadosSet.size > 0 && (
              <button
                type="button"
                onClick={limpiarSeleccion}
                data-testid="btn-limpiar-seleccion"
                className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar selección</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Cálculos Ponderados y Contenido Fino en Tiempo Real */}
      {seleccionadosSet.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#0A1622] border-2 border-[#0891B2] dark:border-[#06B6D4] rounded-2xl p-5 shadow-sm space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-[#1A364E] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                Promedio Calculado de los Lotes Elegidos
              </h2>
            </div>
            <span className="text-xs font-mono-num text-slate-600 dark:text-[#94A3B8]">
              Calculado usando: {usarPesoSeco ? 'Peso sin humedad' : 'Peso neto'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {resumenTiempoReal.promediosLeyes.map((pl, idx) => {
              const bordes = [
                'border-t-4 border-t-violet-500',
                'border-t-4 border-t-indigo-500',
                'border-t-4 border-t-cyan-500',
                'border-t-4 border-t-emerald-500',
              ];
              const badges = [
                'bg-violet-600 text-white',
                'bg-indigo-600 text-white',
                'bg-cyan-600 text-white',
                'bg-emerald-600 text-white',
              ];
              return (
                <div
                  key={pl.codigoLey}
                  className={`bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] ${bordes[idx % bordes.length]} rounded-xl p-3.5 flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-[#CBD5E1]">{pl.nombreLey}</span>
                    <span className={`text-xs font-mono-num font-bold px-2 py-0.5 rounded ${badges[idx % badges.length]}`}>
                      {pl.simbolo} ({pl.unidadMedida})
                    </span>
                  </div>
                  <div
                    className="text-2xl font-mono-num font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-2"
                    data-testid={`promedio-ley-${pl.codigoLey}`}
                  >
                    {formatearNumeroBolivia(pl.leyPromedioRedondeada, decimalesFormato)}{' '}
                    {pl.unidadMedida}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-[#94A3B8] mt-1 font-mono-num">
                    <span>Fino: {pl.contenidoFino} {pl.unidadFino}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      Cobertura: {pl.coberturaPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {resumenTiempoReal.advertencias.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-[#0891B2]/50 dark:border-[#06B6D4]/50 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
              {resumenTiempoReal.advertencias.map((adv, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Tabla Interactiva de Selección de Lotes Disponibles */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3 bg-slate-100 dark:bg-[#0D1D2C] border-b border-slate-200 dark:border-[#1A364E] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#0891B2] dark:text-[#22D3EE]" />
            <span>
              {verSoloSeleccionados
                ? `Revisando grupo seleccionado: ${lotesFiltrados.length} lote(s)`
                : `Lotes DISPONIBLES filtrados: ${lotesFiltrados.length} de ${lotesDisponibles.length}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-[#94A3B8]">Mostrar:</span>
            <select
              value={porPagina}
              onChange={(e) => {
                setPorPagina(Number(e.target.value));
                setPagina(1);
              }}
              className="px-2 py-1 rounded-lg bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] font-mono-num"
            >
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>
          </div>
        </div>

        {lotesVisiblesEnPagina.length === 0 && !cargando ? (
          <EmptyStateMineralSvg
            mensaje={
              verSoloSeleccionados
                ? 'No hay lotes seleccionados que coincidan con el filtro actual'
                : 'No hay lotes disponibles con esos criterios'
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-[#1A364E] bg-white dark:bg-[#0A1622] shadow-xs">
            <table className="w-full text-left table-excel select-none">
              <thead>
                <tr className="border-b-2 border-slate-300 dark:border-[#244869] bg-slate-100 dark:bg-[#0D1D2C] text-xs font-bold text-slate-700 dark:text-[#94A3B8]">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-slate-300 dark:border-[#1A364E]">
                    <button
                      type="button"
                      onClick={toggleSeleccionarVisibles}
                      className="inline-flex items-center justify-center text-[#0891B2] dark:text-[#22D3EE]"
                      aria-label="Seleccionar o deseleccionar filas visibles"
                    >
                      {todosVisiblesSeleccionados ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 dark:text-[#94A3B8]" />
                      )}
                    </button>
                  </th>
                  <th className="py-2.5 px-3 border-r border-slate-300 dark:border-[#1A364E]">N.º Lote</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 dark:border-[#1A364E]">Fecha</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 dark:border-[#1A364E]">Proveedor / Mina</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 dark:border-[#1A364E]">Mineral</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-300 dark:border-[#1A364E]">Sacos</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-300 dark:border-[#1A364E]">Peso Húmedo / Seco</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 dark:border-[#1A364E]">Leyes Individuales</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-300 dark:border-[#1A364E]">Valor Lote / Saco</th>
                  <th className="py-2.5 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#152E42] text-xs">
                {lotesVisiblesEnPagina.map((lote) => {
                  const marcado = seleccionadosSet.has(lote.id);
                  const vl = calcularValorizacionLote(lote, cotizaciones, usarPesoSeco, tipoCambio);
                  return (
                    <tr
                      key={lote.id}
                      onClick={(e) => manejarClicFila(lote.id, e)}
                      data-testid={`fila-lote-${lote.numeroLote}`}
                      data-selected={marcado ? 'true' : 'false'}
                      className={`cursor-pointer table-row-perf ${
                        marcado
                          ? 'fila-seleccionada'
                          : 'hover:bg-slate-100 dark:hover:bg-[#0F2232]/60'
                      }`}
                    >
                      <td
                        className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-[#152E42]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => {}}
                          onClick={(e) => manejarClicFila(lote.id, e)}
                          aria-label={`Seleccionar lote ${lote.numeroLote}`}
                          className="w-4 h-4 accent-[#06B6D4] rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono-num font-bold text-slate-900 dark:text-[#F8FAFC] border-r border-slate-200 dark:border-[#152E42]">
                        {lote.numeroLote}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-[#94A3B8] border-r border-slate-200 dark:border-[#152E42]">
                        {formatearFechaBolivia(lote.fechaCompra)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#152E42]">
                        <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                          {lote.proveedorNombre}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">{lote.minaOrigen}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-[#E2E8F0] border-r border-slate-200 dark:border-[#152E42]">
                        {lote.tipoMineral}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num font-semibold border-r border-slate-200 dark:border-[#152E42]">
                        <span className="text-slate-900 dark:text-[#F8FAFC]">{lote.cantidadSacos}</span>
                        <span className="block text-[10px] font-normal text-slate-500 dark:text-[#94A3B8]">
                          {formatearNumeroBolivia(vl.pesoPorSacoKg, 1)} kg/saco
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num border-r border-slate-200 dark:border-[#152E42]">
                        <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                          {formatearNumeroBolivia(lote.pesoNeto, 2)} {lote.unidadPeso}
                        </span>
                        <span className="text-[10px] text-cyan-700 dark:text-cyan-400 block font-medium">
                          Seco: {formatearNumeroBolivia(lote.pesoSeco || lote.pesoNeto, 2)} {lote.unidadPeso}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#152E42]">
                        <div className="flex flex-wrap gap-1">
                          {lote.leyes.map((ley) => (
                            <span
                              key={ley.codigoLey}
                              className="badge-ley-excel"
                            >
                              <span className="text-slate-500 dark:text-slate-400">{ley.simbolo}:</span>
                              <span>{ley.valorStr} {ley.unidadMedida}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num border-r border-slate-200 dark:border-[#152E42]">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400 block">
                          {formatearMonedaBob(vl.valorNetoBob)}
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium block">
                          {formatearMonedaBob(vl.valorPorSacoBob)} / saco
                        </span>
                      </td>
                      <td
                        className="py-2.5 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {marcado ? (
                          <button
                            type="button"
                            onClick={() => quitarLoteDeSeleccion(lote.id)}
                            className="px-2.5 py-1 rounded text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/60 transition"
                          >
                            Quitar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => manejarClicFila(lote.id, e)}
                            className="px-2.5 py-1 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#0D1D2C] hover:bg-sky-50 dark:hover:bg-cyan-950/40 hover:text-cyan-700 dark:hover:text-cyan-300 border border-slate-300 dark:border-[#1A364E] transition"
                          >
                            Elegir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-5 py-3 bg-slate-50 dark:bg-[#060D14] border-t border-slate-200 dark:border-[#1A364E] flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-[#94A3B8]">
              Página {pagina} de {totalPaginas} (La selección de {seleccionadosSet.size} lotes se conserva al cambiar de página)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A364E] bg-white dark:bg-[#0A1622] disabled:opacity-40 font-semibold"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={pagina === totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1A364E] bg-white dark:bg-[#0A1622] disabled:opacity-40 font-semibold"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MÓDULO 5: Barra Flotante Inferior de Resumen en Tiempo Real */}
      <div
        data-testid="barra-flotante-resumen"
        className="fixed bottom-4 left-4 right-4 lg:left-80 z-40 max-w-6xl mx-auto bg-[#071320] dark:bg-[#0D1D2C] text-slate-100 border-2 border-violet-500/60 rounded-2xl shadow-2xl px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                LOTES
              </span>
              <span
                className="text-lg font-mono-num font-extrabold text-white"
                data-testid="resumen-total-lotes"
              >
                {formatearEnteroBolivia(resumenTiempoReal.totalLotes)}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/15 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-300">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 block">
                SACOS
              </span>
              <span
                className="text-lg font-mono-num font-extrabold text-white"
                data-testid="resumen-total-sacos"
              >
                {formatearEnteroBolivia(resumenTiempoReal.totalSacos)}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/15 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                PESO ({usarPesoSeco ? 'SIN HUMEDAD' : 'NETO'})
              </span>
              <span
                className="text-lg font-mono-num font-extrabold text-amber-400"
                data-testid="resumen-peso-total"
              >
                {resumenTiempoReal.pesoTotalKgStr} kg
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-white/15 hidden sm:block" />

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
              A RECIBIR ({formatearMonedaBob(valorizacionSeleccion.valorPromedioPorSacoBob)}/saco)
            </span>
            <span className="text-lg font-mono-num font-extrabold text-emerald-400">
              {formatearMonedaBob(valorizacionSeleccion.valorNetoTotalBob)}
            </span>
          </div>

          <div className="h-8 w-px bg-white/15 hidden sm:block" />

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
              LEY PROMEDIO CALCULADA
            </span>
            <span
              className="text-sm sm:text-base font-mono-num font-bold text-white"
              data-testid="resumen-ley-promedio"
            >
              {textoLeyBarraResumen}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {seleccionadosSet.size > 0 && (
            <button
              type="button"
              onClick={() => setVerSoloSeleccionados((v) => !v)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white btn-tactile cursor-pointer"
            >
              {verSoloSeleccionados ? 'Ver Todos' : 'Revisar Grupo'}
            </button>
          )}

          {puedeConfirmarVenta ? (
            <button
              type="button"
              disabled={seleccionadosSet.size === 0 || !resumenTiempoReal.esValido}
              onClick={() => {
                setErrorVenta('');
                setIdempotencyKeyActual(
                  `IDEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                );
                setModalConfirmarAbierto(true);
              }}
              data-testid="btn-continuar-venta"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-40 text-white text-xs font-bold shadow-md btn-tactile cursor-pointer"
            >
              <span>Continuar con la Venta</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          ) : (
            <span className="text-xs text-amber-400 font-semibold px-3 py-1.5 rounded-lg bg-white/5">
              Usuario solo consulta
            </span>
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Venta */}
      {modalConfirmarAbierto && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar y Cerrar Venta de Lotes"
        >
          <div className="modal-enter-emil bg-slate-50 dark:bg-[#060D14] border-2 border-violet-500/50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-violet-700 to-cyan-700 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono-num uppercase tracking-widest text-amber-300">
                  RESUMEN FINAL ANTES DE CONFIRMAR · CÓDIGO {idempotencyKeyActual}
                </span>
                <h2 className="text-lg font-bold">
                  Confirmación y Cierre de Venta de Minerales
                </h2>
              </div>
              <button
                onClick={() => setModalConfirmarAbierto(false)}
                className="p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={ejecutarConfirmacionVenta}
              className="p-6 overflow-y-auto space-y-5 flex-1 text-xs"
            >
              {errorVenta && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/50 dark:border-amber-400/50 text-rose-700 dark:text-rose-300 font-bold flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{errorVenta}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white dark:bg-[#0A1622] p-4 rounded-xl border border-slate-200 dark:border-[#1A364E]">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                    Comprador o Empresa Destinataria *
                  </label>
                  <select
                    required
                    value={compradorId}
                    onChange={(e) => setCompradorId(e.target.value)}
                    data-testid="select-comprador-venta"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-semibold"
                  >
                    {compradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo} — {c.nombre} ({c.identificacion || 'S/NIT'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                    Fecha de Liquidación *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaVenta}
                    onChange={(e) => setFechaVenta(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                    Expediente Interno M-02
                  </label>
                  <input
                    type="text"
                    value={expedienteM02Venta}
                    onChange={(e) => setExpedienteM02Venta(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                    Observaciones del Despacho / Contrato
                  </label>
                  <input
                    type="text"
                    value={observacionesVenta}
                    onChange={(e) => setObservacionesVenta(e.target.value)}
                    placeholder="Opcional: N.º de contrato comercial, destino de embarque, precintos..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-xl p-4 space-y-3">
                <h3 className="font-bold uppercase text-[#0891B2] dark:text-[#22D3EE] tracking-wider">
                  Cálculos Definitivos de la Operación
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E]">
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Total Lotes Incluidos</span>
                    <span className="text-xl font-mono-num font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                      {resumenTiempoReal.totalLotes} lotes
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E]">
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Total de Sacos</span>
                    <span className="text-xl font-mono-num font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                      {formatearEnteroBolivia(resumenTiempoReal.totalSacos)} u.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E]">
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Peso Total ({usarPesoSeco ? 'Seco' : 'Neto'})</span>
                    <span className="text-xl font-mono-num font-extrabold text-[#0891B2] dark:text-[#22D3EE]">
                      {resumenTiempoReal.pesoTotalKgStr} kg
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/40 sm:col-span-2">
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold block">Total Líquido a Recibir (descontada Regalía Ley 535)</span>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-2xl font-mono-num font-extrabold text-emerald-700 dark:text-emerald-300">
                        {formatearMonedaBob(valorizacionSeleccion.valorNetoTotalBob)}
                      </span>
                      <span className="text-sm font-mono-num font-semibold text-emerald-600 dark:text-emerald-400">
                        ({formatearMonedaUsd(valorizacionSeleccion.valorNetoTotalUsd)})
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/40">
                    <span className="text-amber-700 dark:text-amber-300 font-bold block">Valor por Saco</span>
                    <span className="text-lg font-mono-num font-extrabold text-amber-700 dark:text-amber-300 block mt-1">
                      {formatearMonedaBob(valorizacionSeleccion.valorPromedioPorSacoBob)}
                    </span>
                    <span className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8]">
                      {formatearNumeroBolivia(valorizacionSeleccion.pesoPromedioPorSacoKg, 1)} kg/saco
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-slate-600 dark:text-[#94A3B8] font-bold block mb-2">
                    Promedios Ponderados de Leyes y Contenido Fino:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {resumenTiempoReal.promediosLeyes.map((pl) => (
                      <div
                        key={pl.codigoLey}
                        className="p-2.5 rounded-xl bg-cyan-50 dark:bg-[#06B6D4]/15 border border-[#0891B2]/30 dark:border-[#06B6D4]/40"
                      >
                        <div className="text-[11px] font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                          {pl.nombreLey} (Cob. {pl.coberturaPct}%)
                        </div>
                        <div className="text-base font-mono-num font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                          {formatearNumeroBolivia(pl.leyPromedioRedondeada, 2)} {pl.unidadMedida}
                        </div>
                        <div className="text-[10px] font-mono-num text-amber-600 dark:text-amber-400 font-bold">
                          Fino: {pl.contenidoFino} {pl.unidadFino}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-xl p-4">
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block mb-2">
                  Lotes seleccionados que cambiarán a estado VENDIDO ({listaLotesSeleccionados.length}):
                </span>
                <div className="max-h-36 overflow-y-auto flex flex-wrap gap-1.5">
                  {listaLotesSeleccionados.map((l) => (
                    <span
                      key={l.id}
                      className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#0D1D2C] border border-slate-200 dark:border-[#1A364E] font-mono-num font-semibold text-[11px]"
                    >
                      {l.numeroLote} ({formatearNumeroBolivia(l.pesoNeto, 0)} {l.unidadPeso})
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1A364E]">
                <button
                  type="button"
                  onClick={() => setModalConfirmarAbierto(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A364E] font-bold text-slate-600 dark:text-[#94A3B8] btn-tactile cursor-pointer"
                >
                  Revisar Selección
                </button>
                <button
                  type="submit"
                  disabled={confirmando}
                  data-testid="btn-confirmar-cierre-venta"
                  className="px-6 py-2.5 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] hover:bg-[#0e7490] dark:hover:bg-[#22D3EE] text-white font-bold shadow-md disabled:opacity-60 btn-tactile cursor-pointer"
                >
                  {confirmando
                    ? 'Ejecutando transacción atómica...'
                    : `Confirmar y Cerrar Venta (${resumenTiempoReal.totalLotes} Lotes)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
