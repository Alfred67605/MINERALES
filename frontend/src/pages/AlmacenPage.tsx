import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Warehouse,
  Search,
  ArrowUpDown,
  RotateCcw,
  Eye,
  CheckSquare,
  Package,
  Scale,
  Layers,
  X,
  ArrowRightLeft,
  SlidersHorizontal,
  Download,
  FileDown,
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
  formatearNumeroBolivia,
  getMineralBadgeClass,
} from '../utils/calculations';
import { exportarInventarioAlmacenPDF } from '../utils/reportExporter';
import { EmptyStateMineralSvg } from '../components/MineralGraphics';

export function AlmacenPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tienePermiso } = useAuth();
  const puedeMoverUbicacion = tienePermiso('ADMINISTRADOR', 'ALMACENERO');

  const [tabVista, setTabVista] = useState<'INVENTARIO' | 'KARDEX'>('INVENTARIO');
  const [lotes, setLotes] = useState<LoteItem[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [movimientosKardex, setMovimientosKardex] = useState<any[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionReferencia[]>(COTIZACIONES_OFICIALES_FALLBACK);
  const [tipoCambio, setTipoCambio] = useState<number>(TIPO_CAMBIO_OFICIAL_BOB);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [estadoFiltro, setEstadoFiltro] = useState<'DISPONIBLE' | 'VENDIDO' | 'TODOS'>('DISPONIBLE');
  const [proveedorId, setProveedorId] = useState('');
  const [ubicacionId, setUbicacionId] = useState('');
  const [tipoMineral, setTipoMineral] = useState('');

  // Columnas configurables
  const [mostrarColumnaSeco, setMostrarColumnaSeco] = useState(true);
  const [mostrarColumnaUbicacion, setMostrarColumnaUbicacion] = useState(true);

  // Ordenamiento y paginación
  const [sortBy, setSortBy] = useState<'numeroLote' | 'fechaCompra' | 'cantidadSacos' | 'pesoNeto' | 'proveedor'>('numeroLote');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(20);

  // Drawer de detalle y cambio de ubicación
  const [loteDetalle, setLoteDetalle] = useState<LoteItem | null>(null);
  const [nuevaUbicacionId, setNuevaUbicacionId] = useState('');
  const [motivoTraslado, setMotivoTraslado] = useState('');
  const [mensajeOperacion, setMensajeOperacion] = useState('');

  const cargarAlmacen = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (estadoFiltro !== 'TODOS') params.set('estado', estadoFiltro);
      if (proveedorId) params.set('proveedorId', proveedorId);
      if (ubicacionId) params.set('ubicacionId', ubicacionId);
      if (tipoMineral) params.set('tipoMineral', tipoMineral);
      if (q.trim()) params.set('q', q.trim());
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const [resLotes, resProv, resUbi, resKardex, resCot] = await Promise.all([
        apiFetch<{ lotes: LoteItem[] }>(`/api/lotes?${params.toString()}`),
        apiFetch<{ proveedores: any[] }>('/api/proveedores'),
        apiFetch<{ ubicaciones: any[] }>('/api/ubicaciones-almacen'),
        apiFetch<{ movimientos: any[] }>('/api/kardex?limit=150'),
        apiFetch<{ cotizaciones: CotizacionReferencia[]; tipoCambioBobUsd?: number }>('/api/cotizaciones').catch(
          () => ({ cotizaciones: COTIZACIONES_OFICIALES_FALLBACK, tipoCambioBobUsd: TIPO_CAMBIO_OFICIAL_BOB })
        ),
      ]);

      setLotes(resLotes.lotes);
      setProveedores(resProv.proveedores);
      setUbicaciones(resUbi.ubicaciones);
      setMovimientosKardex(resKardex.movimientos);
      if (resCot.cotizaciones?.length) setCotizaciones(resCot.cotizaciones);
      if (resCot.tipoCambioBobUsd) setTipoCambio(resCot.tipoCambioBobUsd);
      setPagina(1);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlmacen();
  }, [estadoFiltro, proveedorId, ubicacionId, tipoMineral, q, sortBy, sortOrder]);

  const resumenInventario = useMemo(() => {
    return calcularResumenEnTiempoReal(lotes, 2, false);
  }, [lotes]);

  const valorizacionInventario = useMemo(() => {
    return calcularValorizacionGrupo(lotes, cotizaciones, false, tipoCambio);
  }, [lotes, cotizaciones, tipoCambio]);

  const resumenPorZona = useMemo(() => {
    const mapa = new Map<string, { id: string; codigo: string; nombre: string; lotes: LoteItem[] }>();
    for (const u of ubicaciones) {
      mapa.set(u.codigo, { id: u.id, codigo: u.codigo, nombre: u.nombre, lotes: [] });
    }
    for (const l of lotes) {
      const code = l.ubicacionCodigo || 'ZONA-A1';
      const entry = mapa.get(code) || { id: l.ubicacionId || '', codigo: code, nombre: l.ubicacionNombre || code, lotes: [] };
      entry.lotes.push(l);
      mapa.set(code, entry);
    }
    return Array.from(mapa.values()).map((z) => ({
      ...z,
      val: calcularValorizacionGrupo(z.lotes, cotizaciones, false, tipoCambio),
    }));
  }, [lotes, ubicaciones, cotizaciones, tipoCambio]);

  const totalPaginas = Math.max(1, Math.ceil(lotes.length / porPagina));
  const lotesPaginados = useMemo(() => {
    const start = (pagina - 1) * porPagina;
    return lotes.slice(start, start + porPagina);
  }, [lotes, pagina, porPagina]);

  const alternarOrden = (campo: typeof sortBy) => {
    if (sortBy === campo) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(campo);
      setSortOrder('asc');
    }
  };

  const restaurarFiltros = () => {
    setQ('');
    setEstadoFiltro('DISPONIBLE');
    setProveedorId('');
    setUbicacionId('');
    setTipoMineral('');
    setSortBy('numeroLote');
    setSortOrder('asc');
    setPagina(1);
  };

  const exportarCSV = () => {
    if (lotes.length === 0) return;
    const encabezados = ['Numero Lote', 'Fecha', 'Proveedor', 'Mina', 'Sacos', 'kg/Saco', 'Peso Neto (kg)', 'Peso Seco (kg)', 'Mineral', 'Leyes', 'Valor Lote (Bs)', 'Bs/Saco', 'Estado', 'Ubicacion'];
    const filas = lotes.map((l) => {
      const vl = calcularValorizacionLote(l, cotizaciones, false, tipoCambio);
      return [
        l.numeroLote,
        l.fechaCompra.slice(0, 10),
        `"${l.proveedorNombre.replace(/"/g, '""')}"`,
        `"${(l.minaOrigen || '').replace(/"/g, '""')}"`,
        l.cantidadSacos,
        vl.pesoPorSacoKg.toFixed(2),
        l.pesoNeto,
        l.pesoSeco ?? l.pesoNeto,
        `"${l.tipoMineral}"`,
        `"${l.leyes.map((ley) => `${ley.simbolo}:${ley.valorStr}${ley.unidadMedida}`).join('; ')}"`,
        vl.valorNetoBob.toFixed(2),
        vl.valorPorSacoBob.toFixed(2),
        l.estado,
        `"${l.ubicacionNombre || ''}"`,
      ];
    });
    const contenido = '\uFEFF' + [encabezados.join(';'), ...filas.map((f) => f.join(';'))].join('\r\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventario_MineralFlow_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ejecutarTrasladoUbicacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteDetalle || !nuevaUbicacionId) return;
    const res = await apiFetch(`/api/lotes/${loteDetalle.id}/movimiento`, {
      method: 'POST',
      body: JSON.stringify({
        ubicacionId: nuevaUbicacionId,
        motivo: motivoTraslado || 'Reubicación interna de almacén',
      }),
    });
    setMensajeOperacion(res.mensaje);
    setLoteDetalle(null);
    await cargarAlmacen();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Mi Almacén */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
            Mi Almacén
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex rounded-xl bg-[#F1F5F9] dark:bg-[#060D14] p-1 border border-[#CBD5E1] dark:border-[#1A364E]">
              <button
                type="button"
                onClick={() => setTabVista('INVENTARIO')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${tabVista === 'INVENTARIO'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-[#334155] dark:text-[#94A3B8]'
                  }`}
              >
                Lotes Guardados ({lotes.length})
              </button>
              <button
                type="button"
                onClick={() => setTabVista('KARDEX')}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${tabVista === 'KARDEX'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-[#334155] dark:text-[#94A3B8]'
                  }`}
              >
                Movimientos de Almacén ({movimientosKardex.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => exportarInventarioAlmacenPDF(lotes, cotizaciones, `INVENTARIO (${estadoFiltro})`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-xs"
              title="Descargar reporte completo en PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Descargar PDF</span>
            </button>

            <button
              type="button"
              onClick={exportarCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 hover:bg-amber-100 dark:hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-400/50 text-xs font-bold transition shadow-xs"
              title="Descargar lista en archivo Excel/CSV"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Descargar Excel</span>
            </button>

            <button
              onClick={() => navigate('/seleccion-venta')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-sm transition"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Vender Lotes</span>
            </button>
          </div>
        </div>

        {/* Resumen rápido del inventario mostrado con Colores Diferenciados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-[#CBD5E1] dark:border-[#1A364E]">
          <div className="bg-[#F8FAFC] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-cyan-500 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-cyan-600 dark:text-cyan-400 block">
                Lotes Mostrados ({estadoFiltro})
              </span>
              <span className="text-2xl font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {formatearEnteroBolivia(resumenInventario.totalLotes)}
              </span>
            </div>
            <Layers className="w-7 h-7 text-cyan-500" />
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-violet-500 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-violet-600 dark:text-violet-400 block">
                Total de Sacos
              </span>
              <span className="text-2xl font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {formatearEnteroBolivia(resumenInventario.totalSacos)} u.
              </span>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8] block font-mono-num">
                Promedio: {formatearNumeroBolivia(valorizacionInventario.pesoPromedioPorSacoKg, 1)} kg/saco
              </span>
            </div>
            <Package className="w-7 h-7 text-violet-500" />
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] border-l-4 border-l-amber-500 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 block">
                Peso Total
              </span>
              <span className="text-xl font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {resumenInventario.pesoTotalKgStr} kg
              </span>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8] block font-mono-num">
                Sin humedad: {resumenInventario.pesoTotalSecoKgStr} kg ({resumenInventario.pesoTotalTmStr} TM)
              </span>
            </div>
            <Scale className="w-7 h-7 text-amber-500" />
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3.5">
            <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300 block">
              Valor Estimado Stock
            </span>
            <span className="text-xl font-mono-num font-extrabold text-emerald-700 dark:text-emerald-300 block mt-0.5">
              {formatearMonedaBob(valorizacionInventario.valorNetoTotalBob)}
            </span>
            <span className="text-xs font-mono-num text-emerald-700/80 dark:text-emerald-200/80 block">
              {formatearMonedaBob(valorizacionInventario.valorPromedioPorSacoBob)} / saco
            </span>
          </div>
        </div>
      </div>

      {mensajeOperacion && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span>{mensajeOperacion}</span>
          <button onClick={() => setMensajeOperacion('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {tabVista === 'INVENTARIO' ? (
        <>
          {/* Distribución detallada por Zona de Almacén (Sacos, Peso y Valor en Bs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {resumenPorZona.map((z) => {
              const activa = ubicacionId === z.id;
              return (
                <button
                  key={z.codigo}
                  type="button"
                  onClick={() => setUbicacionId(activa ? '' : z.id)}
                  className={`text-left bg-white dark:bg-[#0A1622] border rounded-2xl p-4 shadow-sm transition ${
                    activa
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                      : 'border-[#CBD5E1] dark:border-[#1A364E] hover:border-cyan-500/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-violet-500/15 text-violet-700 dark:text-violet-300 font-mono-num font-bold text-xs">
                      {z.codigo}
                    </span>
                    <span className="text-xs font-mono-num font-bold text-cyan-600 dark:text-cyan-400">
                      {z.val.totalLotes} lotes
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-2 truncate">
                    {z.nombre}
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8] mt-2">
                    <span>{formatearEnteroBolivia(z.val.totalSacos)} sacos</span>
                    <span>{formatearNumeroBolivia(z.val.pesoTotalKg, 0)} kg</span>
                  </div>
                  <div className="text-sm font-mono-num font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatearMonedaBob(z.val.valorNetoTotalBob)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Controles de Búsqueda Instantánea y Filtros Combinados */}
          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end transition-colors">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1">
                Búsqueda Instantánea
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar lote, boleto, proveedor, mina o mineral..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F1F5F9] dark:bg-[#060D14] text-[#0F172A] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl focus:outline-none focus:border-[#0891B2] dark:focus:border-[#06B6D4]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1">
                Estado de Almacén
              </label>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-semibold bg-[#F1F5F9] dark:bg-[#060D14] text-[#0F172A] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl"
              >
                <option value="DISPONIBLE">Solo DISPONIBLE (Predeterminado)</option>
                <option value="VENDIDO">Solo VENDIDO (Histórico)</option>
                <option value="TODOS">Mostrar Todos</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1">
                Proveedor
              </label>
              <select
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F1F5F9] dark:bg-[#060D14] text-[#0F172A] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl"
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
              <label className="block text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1">
                Zona de Almacén
              </label>
              <select
                value={ubicacionId}
                onChange={(e) => setUbicacionId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F1F5F9] dark:bg-[#060D14] text-[#0F172A] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl"
              >
                <option value="">Todas las zonas</option>
                {ubicaciones.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.codigo} — {u.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={restaurarFiltros}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#1A364E] bg-[#F1F5F9] dark:bg-[#0F2232] hover:bg-slate-200 dark:hover:bg-[#162E44] text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Filtros</span>
              </button>
            </div>
          </div>

          {/* Tabla Principal del Almacén con Columnas Configurables */}
          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden transition-colors">
            <div className="px-5 py-3 bg-[#F8FAFC] dark:bg-[#0D1D2C] border-b border-[#CBD5E1] dark:border-[#1A364E] flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-[#0891B2] dark:text-[#22D3EE]" />
                <span>
                  Conteo de resultados: {lotes.length} lote(s) · Página {pagina} de {totalPaginas}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#334155] dark:text-[#94A3B8]">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Columnas:
                </span>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarColumnaUbicacion}
                    onChange={(e) => setMostrarColumnaUbicacion(e.target.checked)}
                    className="accent-[#06B6D4]"
                  />
                  <span>Zona</span>
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarColumnaSeco}
                    onChange={(e) => setMostrarColumnaSeco(e.target.checked)}
                    className="accent-[#06B6D4]"
                  />
                  <span>Peso Seco / H₂O</span>
                </label>

                <select
                  value={porPagina}
                  onChange={(e) => {
                    setPorPagina(Number(e.target.value));
                    setPagina(1);
                  }}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC] font-mono-num"
                >
                  <option value={15}>15 por pág.</option>
                  <option value={20}>20 por pág.</option>
                  <option value={50}>50 por pág.</option>
                </select>
              </div>
            </div>

            {lotesPaginados.length === 0 && !cargando ? (
              <EmptyStateMineralSvg />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#CBD5E1] dark:border-[#1A364E] bg-[#F1F5F9] dark:bg-[#060D14] text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
                      <th className="py-3 px-4">
                        <button
                          onClick={() => alternarOrden('numeroLote')}
                          className="inline-flex items-center gap-1 hover:text-[#0F172A] dark:hover:text-white"
                        >
                          <span>N.º Lote</span>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </th>
                      <th className="py-3 px-3">
                        <button
                          onClick={() => alternarOrden('fechaCompra')}
                          className="inline-flex items-center gap-1 hover:text-[#0F172A] dark:hover:text-white"
                        >
                          <span>Fecha</span>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </th>
                      <th className="py-3 px-3">
                        <button
                          onClick={() => alternarOrden('proveedor')}
                          className="inline-flex items-center gap-1 hover:text-[#0F172A] dark:hover:text-white"
                        >
                          <span>Proveedor / Mina</span>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </th>
                      {mostrarColumnaUbicacion && <th className="py-3 px-3">Zona</th>}
                      <th className="py-3 px-3 text-right">
                        <button
                          onClick={() => alternarOrden('cantidadSacos')}
                          className="inline-flex items-center gap-1 hover:text-[#0F172A] dark:hover:text-white"
                        >
                          <span>Sacos</span>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </th>
                      <th className="py-3 px-3 text-right">
                        <button
                          onClick={() => alternarOrden('pesoNeto')}
                          className="inline-flex items-center gap-1 hover:text-[#0F172A] dark:hover:text-white"
                        >
                          <span>Peso Húmedo</span>
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                      </th>
                      {mostrarColumnaSeco && (
                        <th className="py-3 px-3 text-right">Peso Seco (H₂O)</th>
                      )}
                      <th className="py-3 px-3">Leyes</th>
                      <th className="py-3 px-3 text-right">Valor Lote (Bs)</th>
                      <th className="py-3 px-3 text-center">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CBD5E1]/60 dark:divide-[#1A364E]/60 text-xs">
                    {lotesPaginados.map((lote) => {
                      const esDisponible = lote.estado === 'DISPONIBLE';
                      const vl = calcularValorizacionLote(lote, cotizaciones, false, tipoCambio);
                      return (
                        <tr key={lote.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0F2232]/60 transition">
                          <td className="py-3 px-4 font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                            {lote.numeroLote}
                            <span className="block text-[10px] font-normal text-[#64748B] dark:text-[#94A3B8]">
                              {lote.tipoMineral}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#334155] dark:text-[#94A3B8]">
                            {formatearFechaBolivia(lote.fechaCompra)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                              {lote.proveedorNombre}
                            </div>
                            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                              {lote.minaOrigen}
                            </div>
                          </td>
                          {mostrarColumnaUbicacion && (
                            <td className="py-3 px-3">
                              <span className="px-2.5 py-0.5 rounded bg-violet-50 dark:bg-violet-500/15 border border-violet-300 dark:border-violet-500/40 font-mono-num font-bold text-xs text-violet-700 dark:text-violet-300">
                                {lote.ubicacionCodigo || 'ZONA-A1'}
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-3 text-right font-mono-num font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                            {lote.cantidadSacos}
                            <span className="block text-[10px] font-normal text-[#64748B] dark:text-[#94A3B8]">
                              {formatearNumeroBolivia(vl.pesoPorSacoKg, 1)} kg/saco
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                            {formatearNumeroBolivia(lote.pesoNeto, 2)} {lote.unidadPeso}
                          </td>
                          {mostrarColumnaSeco && (
                            <td className="py-3 px-3 text-right font-mono-num text-amber-600 dark:text-amber-400 font-semibold">
                              {formatearNumeroBolivia(lote.pesoSeco || lote.pesoNeto, 2)} {lote.unidadPeso}
                              <span className="block text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                                {lote.humedadPct || 0}% humedad
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1.5">
                              {lote.leyes.map((ley) => (
                                <span
                                  key={ley.codigoLey}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono-num font-bold border ${getMineralBadgeClass(ley.simbolo)}`}
                                >
                                  {ley.simbolo}: {ley.valorStr} {ley.unidadMedida}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono-num">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                              {formatearMonedaBob(vl.valorNetoBob)}
                            </span>
                            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block">
                              {formatearMonedaBob(vl.valorPorSacoBob)} / saco
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${esDisponible
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                                }`}
                            >
                              {lote.estado}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setLoteDetalle(lote);
                                setNuevaUbicacionId(lote.ubicacionId || ubicaciones[0]?.id || '');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0891B2] dark:text-[#22D3EE] bg-cyan-50 dark:bg-[#06B6D4]/15 hover:bg-cyan-100 dark:hover:bg-[#06B6D4]/25 border border-[#06B6D4]/40 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Ficha</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* VISTA HISTORIAL DE MOVIMIENTOS DE ALMACÉN */
        <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden transition-colors">
          <div className="px-5 py-3.5 bg-[#F8FAFC] dark:bg-[#0D1D2C] border-b border-[#CBD5E1] dark:border-[#1A364E] flex items-center justify-between text-xs">
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-cyan-500" />
              <span>Historial de Movimientos de Almacén ({movimientosKardex.length})</span>
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1F5F9] dark:bg-[#060D14] border-b border-[#CBD5E1] dark:border-[#1A364E] text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-3">Lote / Proveedor</th>
                  <th className="py-3 px-3">Tipo Movimiento</th>
                  <th className="py-3 px-3">Origen → Destino</th>
                  <th className="py-3 px-3 text-right">Sacos (Antes → Después)</th>
                  <th className="py-3 px-3 text-right">Peso kg (Antes → Después)</th>
                  <th className="py-3 px-4">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1]/60 dark:divide-[#1A364E]/60 text-xs text-[#0F172A] dark:text-[#F8FAFC]">
                {movimientosKardex.map((m) => (
                  <tr key={m.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#0F2232]/60">
                    <td className="py-3 px-4 font-mono-num text-[#334155] dark:text-[#94A3B8]">
                      {formatearFechaBolivia(m.fechaHora)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC] block">
                        {m.numeroLote}
                      </span>
                      <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {m.proveedorNombre}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-[#0891B2] dark:text-[#22D3EE] border border-[#06B6D4]/30 font-mono-num font-bold text-[11px]">
                        {m.tipoMovimiento}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">
                      {m.ubicacionOrigen} → <strong>{m.ubicacionDestino}</strong>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num">
                      {m.sacosAntes} → <strong>{m.sacosDespues}</strong>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num">
                      {formatearNumeroBolivia(m.pesoKgAntes, 0)} →{' '}
                      <strong>{formatearNumeroBolivia(m.pesoKgDespues, 0)} kg</strong>
                    </td>
                    <td className="py-3 px-4 text-[#334155] dark:text-[#94A3B8]">{m.usuarioNombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawer Lateral de Detalle y Cambio de Ubicación en Almacén */}
      <AnimatePresence>
        {loteDetalle && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs">
            <motion.div
              initial={{ x: 480 }}
              animate={{ x: 0 }}
              exit={{ x: 480 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-lg bg-white dark:bg-[#0A1622] h-full shadow-2xl border-l border-[#CBD5E1] dark:border-[#06B6D4] flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 bg-gradient-to-r from-[#071320] to-[#0F2232] border-b border-[#06B6D4]/40 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-num uppercase tracking-widest text-[#22D3EE]">
                    FICHA DE INVENTARIO EN ALMACÉN
                  </span>
                  <h2 className="text-xl font-mono-num font-bold">{loteDetalle.numeroLote}</h2>
                </div>
                <button onClick={() => setLoteDetalle(null)} className="text-slate-300 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-[#0F172A] dark:text-[#F8FAFC]">
                <div className="grid grid-cols-2 gap-3 bg-[#F1F5F9] dark:bg-[#060D14] p-4 rounded-xl border border-[#CBD5E1] dark:border-[#1A364E]">
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">Proveedor</span>
                    <span className="font-bold">{loteDetalle.proveedorNombre}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">Mina de Origen</span>
                    <span className="font-bold">{loteDetalle.minaOrigen}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">Peso Neto Húmedo</span>
                    <span className="font-mono-num font-bold">
                      {formatearNumeroBolivia(loteDetalle.pesoNeto, 2)} {loteDetalle.unidadPeso}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block">
                      Peso Neto Seco ({loteDetalle.humedadPct || 0}% H₂O)
                    </span>
                    <span className="font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE]">
                      {formatearNumeroBolivia(loteDetalle.pesoSeco || loteDetalle.pesoNeto, 2)} {loteDetalle.unidadPeso}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-bold uppercase text-[#64748B] dark:text-[#94A3B8] block mb-2">
                    Leyes Químicas Registradas
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {loteDetalle.leyes.map((l) => (
                      <div
                        key={l.codigoLey}
                        className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0F2232] border border-[#CBD5E1] dark:border-[#1A364E]"
                      >
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{l.nombreLey}</div>
                        <div className="text-base font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                          {l.valorStr} {l.unidadMedida}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {puedeMoverUbicacion && loteDetalle.estado === 'DISPONIBLE' && (
                  <form
                    onSubmit={ejecutarTrasladoUbicacion}
                    className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] space-y-3"
                  >
                    <span className="font-bold text-[#0891B2] dark:text-[#22D3EE] block">
                      Registrar Traslado Interno de Ubicación (Kardex)
                    </span>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Zona Destino</label>
                      <select
                        value={nuevaUbicacionId}
                        onChange={(e) => setNuevaUbicacionId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC]"
                      >
                        {ubicaciones.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.codigo} — {u.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold mb-1">Motivo</label>
                      <input
                        type="text"
                        value={motivoTraslado}
                        onChange={(e) => setMotivoTraslado(e.target.value)}
                        placeholder="Ej. Reacomodo para consolidación de despacho"
                        className="w-full px-3 py-2 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] hover:bg-[#0e7490] text-white dark:text-[#041019] font-bold transition"
                    >
                      Confirmar Traslado en Kardex
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
