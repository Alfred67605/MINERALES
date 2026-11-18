import React, { useEffect, useState } from 'react';
import {
  PackagePlus,
  Plus,
  Trash2,
  Search,
  Filter,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  FileText,
  Scale,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  LoteItem,
  calcularPesoNetoHumedo,
  calcularPesoSecoDesdeHumedad,
  formatearFechaBolivia,
  formatearNumeroBolivia,
} from '../utils/calculations';
import { EmptyStateMineralSvg } from '../components/MineralGraphics';

interface NuevoLoteForm {
  numeroLote: string;
  minaOrigen: string;
  cantidadSacos: number;
  pesoBrutoHumedo: string;
  pesoTara: string;
  pesoNeto: string;
  humedadPct: string;
  pesoSeco: string;
  boletoPesaje: string;
  unidadPeso: 'KG' | 'TM';
  tipoMineral: string;
  observaciones: string;
  leyes: {
    catalogoLeyId: string;
    valor: string;
    tipoEnsaye: 'PROVISIONAL' | 'FINAL' | 'LABORATORIO_EXTERNO' | 'DIRIMENCIA';
    nroCertificado: string;
  }[];
}

export function ComprasLotesPage() {
  const { tienePermiso } = useAuth();
  const puedeRegistrarEditar = tienePermiso('ADMINISTRADOR', 'ALMACENERO');

  const [lotes, setLotes] = useState<LoteItem[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [catalogoLeyes, setCatalogoLeyes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [q, setQ] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroProveedorId, setFiltroProveedorId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  // Wizard Stepper de Nueva Compra Multilote (4 pasos guiados)
  const [modalNuevaCompra, setModalNuevaCompra] = useState(false);
  const [pasoStepper, setPasoStepper] = useState<1 | 2 | 3 | 4>(1);
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().slice(0, 10));
  const [proveedorCompraId, setProveedorCompraId] = useState('');
  const [boletoPesajeCompra, setBoletoPesajeCompra] = useState('');
  const [guiaRemisionCompra, setGuiaRemisionCompra] = useState('');
  const [expedienteM02Compra, setExpedienteM02Compra] = useState('');
  const [estadoM02Compra, setEstadoM02Compra] = useState<'PENDIENTE' | 'RECIBIDO' | 'VERIFICADO'>('RECIBIDO');
  const [obsCompra, setObsCompra] = useState('');
  const [lotesForm, setLotesForm] = useState<NuevoLoteForm[]>([]);
  const [guardandoCompra, setGuardandoCompra] = useState(false);

  // Drawer lateral de detalle de lote
  const [loteDetalle, setLoteDetalle] = useState<LoteItem | null>(null);
  const [auditoriaLote, setAuditoriaLote] = useState<any[]>([]);

  // Modal de edición de lote disponible
  const [loteEditar, setLoteEditar] = useState<LoteItem | null>(null);
  const [editForm, setEditForm] = useState<{
    numeroLote: string;
    minaOrigen: string;
    cantidadSacos: number;
    pesoBrutoHumedo: string;
    pesoTara: string;
    pesoNeto: string;
    humedadPct: string;
    unidadPeso: 'KG' | 'TM';
    tipoMineral: string;
    observaciones: string;
  } | null>(null);

  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (filtroEstado) params.set('estado', filtroEstado);
      if (filtroProveedorId) params.set('proveedorId', filtroProveedorId);
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);

      const [resLotes, resProv, resCat] = await Promise.all([
        apiFetch<{ lotes: LoteItem[] }>(`/api/lotes?${params.toString()}`),
        apiFetch<{ proveedores: any[] }>('/api/proveedores?estado=ACTIVO'),
        apiFetch<{ catalogoLeyes: any[] }>('/api/catalogo-leyes'),
      ]);

      setLotes(resLotes.lotes);
      setProveedores(resProv.proveedores);
      setCatalogoLeyes(resCat.catalogoLeyes);
    } catch (err: any) {
      setMensajeError(err.message || 'Error al cargar lotes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [q, filtroEstado, filtroProveedorId, desde, hasta]);

  const abrirModalNuevaCompra = () => {
    const defaultProv = proveedores[0]?.id || '';
    const defaultLeyZn = catalogoLeyes.find((c) => c.codigo === 'ZN_PCT')?.id || catalogoLeyes[0]?.id || '';
    const defaultLeyAg = catalogoLeyes.find((c) => c.codigo === 'AG_GT')?.id || '';
    const seq = lotes.length + 201;
    const nextNum = `LT-2026-${String(seq).padStart(4, '0')}`;

    setPasoStepper(1);
    setProveedorCompraId(defaultProv);
    setFechaCompra(new Date().toISOString().slice(0, 10));
    setBoletoPesajeCompra(`BP-2026-${seq}`);
    setGuiaRemisionCompra(`GR-00${seq}`);
    setExpedienteM02Compra(`M02-INT-2026-${seq}`);
    setEstadoM02Compra('RECIBIDO');
    setObsCompra('');
    setLotesForm([
      {
        numeroLote: nextNum,
        minaOrigen: proveedores[0]?.minaOrigen || 'Cerro Rico — Potosí',
        cantidadSacos: 30,
        pesoBrutoHumedo: '1545',
        pesoTara: '45',
        pesoNeto: '1500',
        humedadPct: '4.00',
        pesoSeco: '1440.00',
        boletoPesaje: `BOL-${nextNum}`,
        unidadPeso: 'KG',
        tipoMineral: 'Complejo Zn-Ag-Pb',
        observaciones: '',
        leyes: [
          ...(defaultLeyZn
            ? [{ catalogoLeyId: defaultLeyZn, valor: '44.50', tipoEnsaye: 'FINAL' as const, nroCertificado: `CERT-${nextNum}` }]
            : []),
          ...(defaultLeyAg
            ? [{ catalogoLeyId: defaultLeyAg, valor: '260.0', tipoEnsaye: 'FINAL' as const, nroCertificado: `CERT-${nextNum}` }]
            : []),
        ],
      },
    ]);
    setMensajeError('');
    setModalNuevaCompra(true);
  };

  const recalcularPesosFila = (
    index: number,
    campo: 'bruto' | 'tara' | 'neto' | 'humedad',
    nuevoValor: string
  ) => {
    setLotesForm((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const actualizado = { ...item };
        if (campo === 'bruto') actualizado.pesoBrutoHumedo = nuevoValor;
        if (campo === 'tara') actualizado.pesoTara = nuevoValor;
        if (campo === 'neto') actualizado.pesoNeto = nuevoValor;
        if (campo === 'humedad') actualizado.humedadPct = nuevoValor;

        try {
          if (campo === 'bruto' || campo === 'tara') {
            const netoCalc = calcularPesoNetoHumedo(
              actualizado.pesoBrutoHumedo || '0',
              actualizado.pesoTara || '0'
            );
            if (netoCalc.gt(0)) {
              actualizado.pesoNeto = netoCalc.toFixed(2);
            }
          }
          const secoCalc = calcularPesoSecoDesdeHumedad(
            actualizado.pesoNeto || '0',
            actualizado.humedadPct || '0'
          );
          actualizado.pesoSeco = secoCalc.toFixed(2);
        } catch {
          // Mantener valor previo si está escribiendo
        }
        return actualizado;
      })
    );
  };

  const agregarFilaLoteEnCompra = () => {
    const defaultLeyZn = catalogoLeyes.find((c) => c.codigo === 'ZN_PCT')?.id || catalogoLeyes[0]?.id || '';
    const seq = lotes.length + 201 + lotesForm.length;
    const nextNum = `LT-2026-${String(seq).padStart(4, '0')}`;
    const provObj = proveedores.find((p) => p.id === proveedorCompraId);

    setLotesForm((prev) => [
      ...prev,
      {
        numeroLote: nextNum,
        minaOrigen: provObj?.minaOrigen || '',
        cantidadSacos: 25,
        pesoBrutoHumedo: '1287.50',
        pesoTara: '37.50',
        pesoNeto: '1250',
        humedadPct: '4.00',
        pesoSeco: '1200.00',
        boletoPesaje: `BOL-${nextNum}`,
        unidadPeso: 'KG',
        tipoMineral: 'Complejo Zn-Ag-Pb',
        observaciones: '',
        leyes: defaultLeyZn
          ? [{ catalogoLeyId: defaultLeyZn, valor: '42.00', tipoEnsaye: 'FINAL', nroCertificado: `CERT-${nextNum}` }]
          : [],
      },
    ]);
  };

  const handleSubmitCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError('');
    setGuardandoCompra(true);
    try {
      const payload = {
        fecha: fechaCompra,
        proveedorId: proveedorCompraId,
        boletoPesaje: boletoPesajeCompra,
        guiaRemision: guiaRemisionCompra,
        expedienteM02: expedienteM02Compra,
        estadoM02: estadoM02Compra,
        observaciones: obsCompra,
        lotes: lotesForm.map((lf) => ({
          numeroLote: lf.numeroLote.trim(),
          minaOrigen: lf.minaOrigen.trim(),
          cantidadSacos: Number(lf.cantidadSacos),
          pesoBrutoHumedo: lf.pesoBrutoHumedo,
          pesoTara: lf.pesoTara,
          pesoNeto: lf.pesoNeto,
          humedadPct: lf.humedadPct,
          pesoSeco: lf.pesoSeco,
          boletoPesaje: lf.boletoPesaje,
          unidadPeso: lf.unidadPeso,
          tipoMineral: lf.tipoMineral,
          observaciones: lf.observaciones,
          leyes: lf.leyes.map((l) => ({
            catalogoLeyId: l.catalogoLeyId,
            valor: l.valor,
            tipoEnsaye: l.tipoEnsaye,
            nroCertificado: l.nroCertificado,
          })),
        })),
      };

      const res = await apiFetch('/api/compras', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setMensajeExito(res.mensaje || 'Compra y lotes registrados en estado DISPONIBLE.');
      setModalNuevaCompra(false);
      await cargarDatos();
    } catch (err: any) {
      setMensajeError(err.message || 'No se pudo registrar la compra.');
    } finally {
      setGuardandoCompra(false);
    }
  };

  const verDetalleLote = async (lote: LoteItem) => {
    try {
      const res = await apiFetch<{ lote: LoteItem; auditoria: any[] }>(`/api/lotes/${lote.id}`);
      setLoteDetalle(res.lote);
      setAuditoriaLote(res.auditoria);
    } catch (err: any) {
      setMensajeError(err.message);
    }
  };

  const abrirEdicionLote = (lote: LoteItem) => {
    setLoteEditar(lote);
    setEditForm({
      numeroLote: lote.numeroLote,
      minaOrigen: lote.minaOrigen || '',
      cantidadSacos: lote.cantidadSacos,
      pesoBrutoHumedo: String(lote.pesoBrutoHumedo || lote.pesoNeto),
      pesoTara: String(lote.pesoTara || 0),
      pesoNeto: String(lote.pesoNeto),
      humedadPct: String(lote.humedadPct || 0),
      unidadPeso: lote.unidadPeso,
      tipoMineral: lote.tipoMineral,
      observaciones: lote.observaciones || '',
    });
  };

  const guardarEdicionLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteEditar || !editForm) return;
    setMensajeError('');
    try {
      const res = await apiFetch(`/api/lotes/${loteEditar.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          numeroLote: editForm.numeroLote,
          minaOrigen: editForm.minaOrigen,
          cantidadSacos: Number(editForm.cantidadSacos),
          pesoBrutoHumedo: editForm.pesoBrutoHumedo,
          pesoTara: editForm.pesoTara,
          pesoNeto: editForm.pesoNeto,
          humedadPct: editForm.humedadPct,
          unidadPeso: editForm.unidadPeso,
          tipoMineral: editForm.tipoMineral,
          observaciones: editForm.observaciones,
        }),
      });
      setMensajeExito(res.mensaje || 'Lote actualizado.');
      setLoteEditar(null);
      await cargarDatos();
    } catch (err: any) {
      setMensajeError(err.message);
    }
  };

  const limpiarFiltros = () => {
    setQ('');
    setFiltroEstado('');
    setFiltroProveedorId('');
    setDesde('');
    setHasta('');
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Módulo 2 */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
            Registrar Compra
          </h1>
        </div>

        {puedeRegistrarEditar && (
          <button
            onClick={abrirModalNuevaCompra}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition shrink-0"
          >
            <PackagePlus className="w-4 h-4 text-amber-300" />
            <span>Nueva Compra y Lotes</span>
          </button>
        )}
      </div>

      {/* Avisos */}
      <AnimatePresence>
        {mensajeExito && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-cyan-50 dark:bg-[#06B6D4]/15 border border-[#0891B2]/40 dark:border-[#06B6D4]/40 text-[#0891B2] dark:text-[#22D3EE] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
            <button onClick={() => setMensajeExito('')} aria-label="Cerrar aviso">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {mensajeError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-amber-50 dark:bg-amber-950/30 border border-rose-500/40 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{mensajeError}</span>
            </div>
            <button onClick={() => setMensajeError('')} aria-label="Cerrar error">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros Combinados */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
            Buscar por N.º de lote, compra, boleto o M-02
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej. LT-2026-0101, M02-INT, Cerro Rico..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl focus:outline-none focus:border-[#0891B2] dark:focus:border-[#06B6D4]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
            Proveedor
          </label>
          <select
            value={filtroProveedorId}
            onChange={(e) => setFiltroProveedorId(e.target.value)}
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
            Estado del Lote
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
          >
            <option value="">Todos (Disponibles y Vendidos)</option>
            <option value="DISPONIBLE">Solo DISPONIBLE</option>
            <option value="VENDIDO">Solo VENDIDO</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-1">
            Desde Fecha
          </label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
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
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
            />
          </div>
          <button
            onClick={limpiarFiltros}
            title="Restaurar filtros"
            className="p-2 rounded-xl border border-slate-200 dark:border-[#1A364E] text-slate-600 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-[#162E44] mt-5"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabla Principal con Peso Húmedo, Humedad %, Peso Seco y Leyes */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-100 dark:bg-[#0D1D2C] border-b border-slate-200 dark:border-[#1A364E] flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#22D3EE]" />
            <span>Mostrando {lotes.length} lotes registrados</span>
          </span>
          <span className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
            Haga clic en el icono de inspección para abrir el Drawer lateral con boleto de pesaje, certificados y Kardex.
          </span>
        </div>

        {lotes.length === 0 && !cargando ? (
          <EmptyStateMineralSvg />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1A364E] bg-slate-50 dark:bg-[#060D14] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                  <th className="py-3 px-4">N.º Lote / Boleto</th>
                  <th className="py-3 px-3">Compra / M-02</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Proveedor / Mina</th>
                  <th className="py-3 px-3">Mineral</th>
                  <th className="py-3 px-3 text-right">Sacos</th>
                  <th className="py-3 px-3 text-right">Peso Húmedo / Seco</th>
                  <th className="py-3 px-3">Ensayes Químicos</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1A364E]/70 text-xs">
                {lotes.map((lote) => {
                  const esDisponible = lote.estado === 'DISPONIBLE';
                  return (
                    <tr key={lote.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono-num font-bold text-slate-900 dark:text-[#F8FAFC] block">
                          {lote.numeroLote}
                        </span>
                        <span className="text-[10px] font-mono-num text-slate-500 dark:text-[#94A3B8]">
                          {lote.boletoPesaje || 'S/Boleto'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono-num font-semibold text-[#0891B2] dark:text-[#22D3EE] block">
                          {lote.numeroCompra || '-'}
                        </span>
                        <span className="text-[10px] font-mono-num text-slate-500 dark:text-[#94A3B8]">
                          {lote.expedienteM02Compra || 'M-02 Recibido'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-[#94A3B8]">
                        {formatearFechaBolivia(lote.fechaCompra)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{lote.proveedorNombre}</div>
                        <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">{lote.minaOrigen}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900 dark:text-[#F8FAFC]">{lote.tipoMineral}</td>
                      <td className="py-3 px-3 text-right font-mono-num font-semibold">
                        {lote.cantidadSacos}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num">
                        <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                          {formatearNumeroBolivia(lote.pesoNeto, 2)} {lote.unidadPeso}
                        </span>
                        <span className="text-[10px] text-[#0891B2] dark:text-[#22D3EE] block">
                          Seco: {formatearNumeroBolivia(lote.pesoSeco || lote.pesoNeto, 2)} {lote.unidadPeso} ({lote.humedadPct || 0}% H₂O)
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {lote.leyes.map((ley) => (
                            <span
                              key={ley.codigoLey}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono-num font-semibold bg-slate-100 dark:bg-[#0D1D2C] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#1A364E]"
                            >
                              {ley.simbolo}: {ley.valorStr} {ley.unidadMedida}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            esDisponible
                              ? 'bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE] border border-[#0891B2]/30 dark:border-[#06B6D4]/40'
                              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-500/30 dark:border-amber-400/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              esDisponible ? 'bg-[#0891B2] dark:bg-[#06B6D4]' : 'bg-amber-600'
                            }`}
                          />
                          {lote.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => verDetalleLote(lote)}
                            className="p-1.5 rounded-lg text-[#0891B2] dark:text-[#22D3EE] hover:bg-cyan-50 dark:hover:bg-[#06B6D4]/15 transition"
                            title="Abrir Drawer lateral de expediente del lote"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {puedeRegistrarEditar && esDisponible && (
                            <button
                              onClick={() => abrirEdicionLote(lote)}
                              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/15 transition"
                              title="Editar lote disponible"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WIZARD STEPPER DE NUEVA COMPRA Y RECEPCIÓN (4 Pasos Guiados) */}
      {modalNuevaCompra && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-slate-50 dark:bg-[#060D14] border-2 border-[#0891B2]/50 dark:border-[#06B6D4]/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Cabecera del Stepper */}
            <div className="px-6 py-4 bg-[#0891B2] dark:bg-[#06B6D4] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono-num uppercase tracking-widest text-amber-400">
                  WIZARD GUIADO DE RECEPCIÓN MINERA · PASO {pasoStepper} DE 4
                </span>
                <h2 className="text-base font-bold">Registrar Nueva Compra y Lotes Mineros</h2>
              </div>
              <button
                onClick={() => setModalNuevaCompra(false)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Indicador de Pasos */}
            <div className="grid grid-cols-4 bg-slate-100 dark:bg-[#0D1D2C] border-b border-slate-200 dark:border-[#1A364E] text-xs">
              {[
                { n: 1, label: '1. Proveedor y Mina' },
                { n: 2, label: '2. Sacos y Peso' },
                { n: 3, label: '3. Leyes del Mineral' },
                { n: 4, label: '4. Revisar y Guardar' },
              ].map((st) => (
                <button
                  key={st.n}
                  type="button"
                  onClick={() => setPasoStepper(st.n as any)}
                  className={`py-2.5 px-3 font-bold text-left border-r last:border-r-0 border-slate-200 dark:border-[#1A364E] transition ${
                    pasoStepper === st.n
                      ? 'bg-white dark:bg-[#0A1622] text-[#0891B2] dark:text-[#22D3EE] border-b-2 border-b-[#0891B2] dark:border-b-[#06B6D4]'
                      : 'text-slate-600 dark:text-[#94A3B8] hover:bg-white/50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitCompra} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* PASO 1: Proveedor, Fecha y Datos de Recepción */}
              {pasoStepper === 1 && (
                <div className="bg-white dark:bg-[#0A1622] p-5 rounded-2xl border border-slate-200 dark:border-[#1A364E] space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Datos de Procedencia y Recepción en Almacén
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                        Proveedor / Cooperativa Minera *
                      </label>
                      <select
                        required
                        value={proveedorCompraId}
                        onChange={(e) => setProveedorCompraId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-semibold"
                      >
                        {proveedores.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.codigo} — {p.nombre} ({p.minaOrigen || 'Potosí'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                        Fecha de Compra / Recepción *
                      </label>
                      <input
                        type="date"
                        required
                        value={fechaCompra}
                        onChange={(e) => setFechaCompra(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                        N.º Boleto de Pesaje General
                      </label>
                      <input
                        type="text"
                        value={boletoPesajeCompra}
                        onChange={(e) => setBoletoPesajeCompra(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                        Guía de Remisión / Transporte
                      </label>
                      <input
                        type="text"
                        value={guiaRemisionCompra}
                        onChange={(e) => setGuiaRemisionCompra(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: Pesaje de Lotes (Bruto - Tara = Neto Húmedo y Humedad -> Peso Seco) */}
              {pasoStepper === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0891B2] dark:text-[#22D3EE] flex items-center gap-2">
                      <Scale className="w-4 h-4" />
                      <span>Pesaje por Lote (Bruto − Tara = Neto Húmedo y Peso Seco ISO 10251)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={agregarFilaLoteEnCompra}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE] font-bold hover:bg-cyan-100 dark:hover:bg-[#06B6D4]/25"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Otro Lote a la Compra</span>
                    </button>
                  </div>

                  {lotesForm.map((lf, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A364E] pb-2">
                        <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                          Lote #{index + 1} · {lf.numeroLote}
                        </span>
                        {lotesForm.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setLotesForm((prev) => prev.filter((_, idx) => idx !== index))
                            }
                            className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Quitar lote
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block font-bold text-slate-600 dark:text-[#94A3B8] mb-1">N.º Lote *</label>
                          <input
                            type="text"
                            required
                            value={lf.numeroLote}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLotesForm((prev) =>
                                prev.map((it, i) => (i === index ? { ...it, numeroLote: val } : it))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-lg font-mono-num"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 dark:text-[#94A3B8] mb-1">Mineral *</label>
                          <input
                            type="text"
                            required
                            value={lf.tipoMineral}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLotesForm((prev) =>
                                prev.map((it, i) => (i === index ? { ...it, tipoMineral: val } : it))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 dark:text-[#94A3B8] mb-1">Sacos *</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={lf.cantidadSacos}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              setLotesForm((prev) =>
                                prev.map((it, i) =>
                                  i === index ? { ...it, cantidadSacos: val } : it
                                )
                              );
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-lg font-mono-num"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 dark:text-[#94A3B8] mb-1">Unidad</label>
                          <select
                            value={lf.unidadPeso}
                            onChange={(e) => {
                              const val = e.target.value as 'KG' | 'TM';
                              setLotesForm((prev) =>
                                prev.map((it, i) => (i === index ? { ...it, unidadPeso: val } : it))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-lg font-bold"
                          >
                            <option value="KG">Kilogramos (KG)</option>
                            <option value="TM">Toneladas (TM)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-[#060D14] p-3 rounded-xl border border-slate-200 dark:border-[#1A364E]">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-[#94A3B8] mb-1">
                            Peso Bruto Húmedo
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={lf.pesoBrutoHumedo}
                            onChange={(e) => recalcularPesosFila(index, 'bruto', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-lg font-mono-num"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-[#94A3B8] mb-1">
                            Tara (Sacos/Paleta)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={lf.pesoTara}
                            onChange={(e) => recalcularPesosFila(index, 'tara', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-lg font-mono-num"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-[#0891B2] dark:text-[#22D3EE] mb-1">
                            Peso Neto Húmedo *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={lf.pesoNeto}
                            onChange={(e) => recalcularPesosFila(index, 'neto', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0A1622] border-2 border-[#0891B2] dark:border-[#06B6D4] rounded-lg font-mono-num font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-[#94A3B8] mb-1">
                            Humedad (% H₂O)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={lf.humedadPct}
                            onChange={(e) => recalcularPesosFila(index, 'humedad', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-lg font-mono-num"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                            Peso Neto Seco Calc.
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={lf.pesoSeco}
                            className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-[#0D1D2C] border border-slate-200 dark:border-[#1A364E] rounded-lg font-mono-num font-bold text-slate-900 dark:text-[#F8FAFC]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PASO 3: Ensayes de Laboratorio por Lote */}
              {pasoStepper === 3 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Análisis Químico y Certificados de Laboratorio por Lote
                  </h3>
                  {lotesForm.map((lf, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0891B2] dark:text-[#22D3EE]">
                          {lf.numeroLote} ({lf.pesoNeto} {lf.unidadPeso})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const firstCat = catalogoLeyes[0]?.id || '';
                            setLotesForm((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      leyes: [
                                        ...item.leyes,
                                        {
                                          catalogoLeyId: firstCat,
                                          valor: '10.00',
                                          tipoEnsaye: 'FINAL',
                                          nroCertificado: `CERT-${lf.numeroLote}`,
                                        },
                                      ],
                                    }
                                  : item
                              )
                            );
                          }}
                          className="text-xs font-bold text-[#0891B2] dark:text-[#22D3EE] hover:underline"
                        >
                          + Añadir otra ley mineral
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {lf.leyes.map((leyItem, lIdx) => (
                          <div
                            key={lIdx}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <select
                                value={leyItem.catalogoLeyId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLotesForm((prev) =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? {
                                            ...item,
                                            leyes: item.leyes.map((l, j) =>
                                              j === lIdx ? { ...l, catalogoLeyId: val } : l
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="flex-1 px-2.5 py-1.5 bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-lg font-semibold"
                              >
                                {catalogoLeyes.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.simbolo} — {c.nombreLey} ({c.unidadMedida})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={leyItem.valor}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLotesForm((prev) =>
                                    prev.map((item, i) =>
                                      i === index
                                        ? {
                                            ...item,
                                            leyes: item.leyes.map((l, j) =>
                                              j === lIdx ? { ...l, valor: val } : l
                                            ),
                                          }
                                        : item
                                    )
                                  );
                                }}
                                className="w-24 px-2.5 py-1.5 bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-lg font-mono-num font-bold"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PASO 4: Documentación Normativa Interna (SENARECOM M-02) y Confirmación */}
              {pasoStepper === 4 && (
                <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-[#0891B2] dark:text-[#22D3EE] font-bold text-sm">
                    <FileText className="w-4 h-4" />
                    <span>Asistencia Documental Interna (Formulario M-02 / Boleto de Pesaje)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">
                        Código de Expediente Interno M-02
                      </label>
                      <input
                        type="text"
                        value={expedienteM02Compra}
                        onChange={(e) => setExpedienteM02Compra(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Estado Documental M-02</label>
                      <select
                        value={estadoM02Compra}
                        onChange={(e) => setEstadoM02Compra(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-bold"
                      >
                        <option value="PENDIENTE">PENDIENTE</option>
                        <option value="RECIBIDO">RECIBIDO</option>
                        <option value="VERIFICADO">VERIFICADO</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-bold mb-1">Observaciones Generales</label>
                      <input
                        type="text"
                        value={obsCompra}
                        onChange={(e) => setObsCompra(e.target.value)}
                        placeholder="Opcional: detalles de muestreo ISO 12743, precintos o transporte..."
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de navegación del Wizard + Botón directo de Confirmación */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-[#1A364E]">
                <div className="flex items-center gap-2">
                  {pasoStepper > 1 && (
                    <button
                      type="button"
                      onClick={() => setPasoStepper((p) => (p - 1) as any)}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A364E] bg-white dark:bg-[#0A1622] font-bold text-slate-900 dark:text-[#F8FAFC]"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                  )}
                  {pasoStepper < 4 && (
                    <button
                      type="button"
                      onClick={() => setPasoStepper((p) => (p + 1) as any)}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#0D1D2C] font-bold text-slate-900 dark:text-[#F8FAFC]"
                    >
                      Siguiente Paso <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalNuevaCompra(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A364E] font-bold text-slate-600 dark:text-[#94A3B8]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoCompra}
                    className="px-5 py-2.5 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] hover:bg-[#0e7490] dark:hover:bg-[#22D3EE] text-white font-bold shadow-sm disabled:opacity-60"
                  >
                    {guardandoCompra
                      ? 'Registrando...'
                      : `Confirmar Compra (${lotesForm.length} Lote${
                          lotesForm.length > 1 ? 's' : ''
                        })`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER LATERAL DESLIZANTE DE EXPEDIENTE DE LOTE */}
      <AnimatePresence>
        {loteDetalle && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ x: 520 }}
              animate={{ x: 0 }}
              exit={{ x: 520 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-xl bg-white dark:bg-[#0A1622] h-full shadow-2xl border-l border-[#0891B2]/50 dark:border-[#06B6D4]/50 flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 bg-[#0891B2] dark:bg-[#06B6D4] text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono-num uppercase tracking-widest text-amber-400">
                    EXPEDIENTE TÉCNICO Y BOLETO DE PESAJE
                  </span>
                  <h2 className="text-xl font-mono-num font-bold">{loteDetalle.numeroLote}</h2>
                </div>
                <button
                  onClick={() => setLoteDetalle(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-[#060D14] p-4 rounded-xl border border-slate-200 dark:border-[#1A364E]">
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Estado Actual</span>
                    <span className="font-bold text-[#0891B2] dark:text-[#22D3EE]">{loteDetalle.estado}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Compra / M-02</span>
                    <span className="font-mono-num font-bold">{loteDetalle.numeroCompra}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Boleto de Pesaje</span>
                    <span className="font-mono-num font-bold">{loteDetalle.boletoPesaje || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Peso Bruto Húmedo</span>
                    <span className="font-mono-num font-bold">
                      {formatearNumeroBolivia(loteDetalle.pesoBrutoHumedo || loteDetalle.pesoNeto, 2)} {loteDetalle.unidadPeso}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Tara</span>
                    <span className="font-mono-num font-bold">
                      {formatearNumeroBolivia(loteDetalle.pesoTara || 0, 2)} {loteDetalle.unidadPeso}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Peso Neto Húmedo</span>
                    <span className="font-mono-num font-extrabold text-[#0891B2] dark:text-[#22D3EE]">
                      {formatearNumeroBolivia(loteDetalle.pesoNeto, 2)} {loteDetalle.unidadPeso}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Humedad (ISO 10251)</span>
                    <span className="font-mono-num font-bold">{loteDetalle.humedadPct || 0}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Peso Neto Seco</span>
                    <span className="font-mono-num font-extrabold text-amber-600 dark:text-amber-400">
                      {formatearNumeroBolivia(loteDetalle.pesoSeco || loteDetalle.pesoNeto, 2)} {loteDetalle.unidadPeso}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#94A3B8] block">Ubicación Almacén</span>
                    <span className="font-mono-num font-bold">{loteDetalle.ubicacionCodigo}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-2">
                    Certificados y Leyes Químicas del Lote
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {loteDetalle.leyes.map((l) => (
                      <div
                        key={l.codigoLey}
                        className="p-3 rounded-xl bg-slate-100 dark:bg-[#0D1D2C] border border-slate-200 dark:border-[#1A364E]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-900 dark:text-[#F8FAFC]">{l.nombreLey}</span>
                          <span className="text-[10px] font-mono-num bg-white dark:bg-[#0A1622] px-1.5 py-0.5 rounded">
                            v{l.versionActual || 1} · {l.tipoEnsaye || 'FINAL'}
                          </span>
                        </div>
                        <div className="text-lg font-mono-num font-extrabold text-[#0891B2] dark:text-[#22D3EE] mt-1">
                          {l.valorStr} {l.unidadMedida}
                        </div>
                        <div className="text-[10px] font-mono-num text-slate-500 dark:text-[#94A3B8] mt-0.5">
                          Cert: {l.nroCertificado || 'Validado'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {loteDetalle.movimientos && loteDetalle.movimientos.length > 0 && (
                  <div>
                    <h3 className="font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-2">
                      Kardex Físico del Lote ({loteDetalle.movimientos.length})
                    </h3>
                    <div className="space-y-1.5">
                      {loteDetalle.movimientos.map((m: any) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE]">
                              {m.tipoMovimiento}
                            </span>
                            <span className="block text-[11px] text-slate-600 dark:text-[#94A3B8]">
                              {m.ubicacionOrigen} → {m.ubicacionDestino} ({m.motivo})
                            </span>
                          </div>
                          <span className="font-mono-num text-[11px] text-slate-500 dark:text-[#94A3B8]">
                            {formatearFechaBolivia(m.fechaHora)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {auditoriaLote.length > 0 && (
                  <div>
                    <h3 className="font-bold uppercase text-slate-600 dark:text-[#94A3B8] mb-2">
                      Bitácora de Auditoría ({auditoriaLote.length})
                    </h3>
                    <div className="space-y-1.5">
                      {auditoriaLote.map((a) => (
                        <div
                          key={a.id}
                          className="p-2 rounded-lg bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] flex items-center justify-between text-[11px]"
                        >
                          <span>
                            <strong>{a.accion}</strong> por {a.usuarioNombre}
                          </span>
                          <span className="font-mono-num text-slate-500 dark:text-[#94A3B8]">
                            {new Date(a.fechaHora).toLocaleString('es-BO')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Editar Lote DISPONIBLE */}
      {loteEditar && editForm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#0A1622] border border-[#0891B2]/50 dark:border-[#06B6D4]/50 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A364E] pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Editar Lote Disponible: {loteEditar.numeroLote}
              </h2>
              <button onClick={() => setLoteEditar(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicionLote} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">N.º de Lote</label>
                  <input
                    type="text"
                    required
                    value={editForm.numeroLote}
                    onChange={(e) => setEditForm({ ...editForm, numeroLote: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tipo de Mineral</label>
                  <input
                    type="text"
                    required
                    value={editForm.tipoMineral}
                    onChange={(e) => setEditForm({ ...editForm, tipoMineral: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Cantidad de Sacos</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editForm.cantidadSacos}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        cantidadSacos: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Peso Neto ({editForm.unidadPeso})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editForm.pesoNeto}
                    onChange={(e) => setEditForm({ ...editForm, pesoNeto: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Observaciones</label>
                <input
                  type="text"
                  value={editForm.observaciones}
                  onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1A364E]">
                <button
                  type="button"
                  onClick={() => setLoteEditar(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A364E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] text-white font-bold"
                >
                  Guardar Cambios Auditados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
