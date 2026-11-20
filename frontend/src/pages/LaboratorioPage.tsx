import React, { useEffect, useState } from 'react';
import {
  FlaskConical,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit3,
  History,
  X,
  FileBadge,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatearFechaBolivia, formatearNumeroBolivia } from '../utils/calculations';

export function LaboratorioPage() {
  const { tienePermiso } = useAuth();
  const puedeVersionar = tienePermiso('ADMINISTRADOR', 'LABORATORIO', 'ALMACENERO');

  const [ensayes, setEnsayes] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [estadoLote, setEstadoLote] = useState('DISPONIBLE');
  const [pagina, setPagina] = useState(1);
  const porPagina = 20;
  const [cargando, setCargando] = useState(true);

  const [ensayeEditar, setEnsayeEditar] = useState<any | null>(null);
  const [formEnsaye, setFormEnsaye] = useState({
    valor: '',
    tipoEnsaye: 'FINAL',
    estadoMedicion: 'VALIDADO',
    laboratorio: 'Laboratorio Químico KOYOSIAT S.R.L. — Potosí',
    nroCertificado: '',
    motivoCambio: '',
  });

  const [ensayeHistorial, setEnsayeHistorial] = useState<any | null>(null);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

  const cargarEnsayes = async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (estadoLote !== 'TODOS') params.set('estadoLote', estadoLote);
      const res = await apiFetch<{ ensayes: any[] }>(
        `/api/laboratorio/ensayes?${params.toString()}`
      );
      setEnsayes(res.ensayes);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    setPagina(1);
    cargarEnsayes();
  }, [q, estadoLote]);

  const totalPaginas = Math.max(1, Math.ceil(ensayes.length / porPagina));
  const ensayesPaginados = ensayes.slice((pagina - 1) * porPagina, pagina * porPagina);

  const abrirModalVersion = (eItem: any) => {
    setEnsayeEditar(eItem);
    setFormEnsaye({
      valor: String(eItem.valor),
      tipoEnsaye: eItem.tipoEnsaye || 'FINAL',
      estadoMedicion: eItem.estadoMedicion || 'VALIDADO',
      laboratorio: eItem.laboratorio || 'Laboratorio Químico KOYOSIAT S.R.L. — Potosí',
      nroCertificado: eItem.nroCertificado || `CERT-${eItem.numeroLote}`,
      motivoCambio: 'Actualización por certificado de laboratorio validado',
    });
  };

  const guardarNuevaVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ensayeEditar) return;
    setError('');
    try {
      const res = await apiFetch(`/api/laboratorio/ensayes/${ensayeEditar.id}`, {
        method: 'PUT',
        body: JSON.stringify(formEnsaye),
      });
      setExito(res.mensaje);
      setEnsayeEditar(null);
      await cargarEnsayes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Laboratorio */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
            Leyes de Laboratorio
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] text-xs font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            ENSAYES REGISTRADOS: {ensayes.length}
          </div>
        </div>
      </div>

      {exito && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {exito}
          </span>
          <button onClick={() => setExito('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-500/40 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Buscador y Filtros */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 items-end transition-colors">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1">
            Buscar por N.º de Lote, N.º de Certificado o Laboratorio
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej. LT-2026-0101, CERT-LAB-0101..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F1F5F9] dark:bg-[#060D14] text-[#0F172A] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl focus:outline-none focus:border-[#0891B2] dark:focus:border-[#06B6D4]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1">
            Estado del Lote
          </label>
          <select
            value={estadoLote}
            onChange={(e) => setEstadoLote(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold bg-[#F1F5F9] dark:bg-[#060D14] text-[#0F172A] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl"
          >
            <option value="DISPONIBLE">Lotes DISPONIBLES en Almacén</option>
            <option value="VENDIDO">Lotes VENDIDOS (Bloqueados)</option>
            <option value="TODOS">Todos los Lotes</option>
          </select>
        </div>
      </div>

      {/* Tabla de Ensayes y Certificados */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden transition-colors">
        <div className="px-5 py-3 bg-[#F8FAFC] dark:bg-[#0D1D2C] border-b border-[#CBD5E1] dark:border-[#1A364E] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[#0891B2] dark:text-[#22D3EE]" />
            <span>
              Mostrando {ensayesPaginados.length} de {ensayes.length} ensayes · Página {pagina} de {totalPaginas}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] dark:border-[#1A364E] bg-white dark:bg-[#060D14] text-[#0F172A] dark:text-[#F8FAFC] disabled:opacity-40 font-bold"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas}
              className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] dark:border-[#1A364E] bg-white dark:bg-[#060D14] text-[#0F172A] dark:text-[#F8FAFC] disabled:opacity-40 font-bold"
            >
              Siguiente
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-[#1A364E] bg-white dark:bg-[#0A1622] shadow-xs">
          <table className="w-full text-left table-excel">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#0D1D2C] border-b-2 border-slate-300 dark:border-[#244869] text-xs font-bold text-slate-700 dark:text-[#94A3B8]">
                <th className="py-2.5 px-3 border-r border-slate-300 dark:border-[#1A364E]">Lote / Proveedor</th>
                <th className="py-2.5 px-3 border-r border-slate-300 dark:border-[#1A364E]">Ley Mineral</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-300 dark:border-[#1A364E]">Resultado</th>
                <th className="py-2.5 px-3 border-r border-slate-300 dark:border-[#1A364E]">Tipo / Estado Medición</th>
                <th className="py-2.5 px-3 border-r border-slate-300 dark:border-[#1A364E]">Certificado / Laboratorio</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-300 dark:border-[#1A364E]">Versión</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#152E42] text-xs text-[#0F172A] dark:text-[#F8FAFC]">
              {ensayesPaginados.map((eItem) => {
                const esDisponible = eItem.estadoLote === 'DISPONIBLE';
                return (
                  <tr key={eItem.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60 transition">
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#152E42]">
                      <span className="font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC] block">
                        {eItem.numeroLote}
                      </span>
                      <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {eItem.proveedorNombre} ({formatearNumeroBolivia(eItem.pesoNeto, 0)} {eItem.unidadPeso})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#152E42]">
                      <span className="font-bold text-[#0891B2] dark:text-[#22D3EE]">
                        {eItem.simbolo} — {eItem.nombreLey}
                      </span>
                      <span className="block text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                        Unidad: {eItem.unidadMedida}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-num font-extrabold text-sm text-[#0F172A] dark:text-[#F8FAFC] border-r border-slate-200 dark:border-[#152E42]">
                      {eItem.valorStr} {eItem.unidadMedida}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#152E42]">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-semibold text-[10px] mr-1">
                        {eItem.tipoEnsaye}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono-num text-[10px]">
                        {eItem.estadoMedicion}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-[#152E42]">
                      <span className="font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1">
                        <FileBadge className="w-3.5 h-3.5 text-amber-500" />
                        {eItem.nroCertificado || 'CERT-INTERNO'}
                      </span>
                      <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block">
                        {eItem.laboratorio}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-[#152E42]">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 font-mono-num font-bold text-[11px] text-amber-700 dark:text-amber-300">
                        v{eItem.versionActual}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setEnsayeHistorial(eItem)}
                          className="p-1.5 rounded-lg text-[#0891B2] dark:text-[#22D3EE] hover:bg-cyan-50 dark:hover:bg-[#06B6D4]/15"
                          title="Ver historial de versiones del ensaye"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {puedeVersionar && esDisponible && (
                          <button
                            onClick={() => abrirModalVersion(eItem)}
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/15"
                            title="Emitir nueva versión de certificado"
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
      </div>

      {/* Modal Emitir Nueva Versión de Ensaye */}
      {ensayeEditar && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A1622] border-2 border-[#0891B2] dark:border-[#06B6D4] rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs text-[#0F172A] dark:text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-[#CBD5E1] dark:border-[#1A364E] pb-3">
              <div>
                <span className="text-[10px] font-mono-num uppercase text-[#0891B2] dark:text-[#22D3EE] font-bold">
                  NUEVA VERSIÓN DE ENSAYE (v{ensayeEditar.versionActual + 1})
                </span>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {ensayeEditar.numeroLote} — {ensayeEditar.nombreLey} ({ensayeEditar.unidadMedida})
                </h2>
              </div>
              <button onClick={() => setEnsayeEditar(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarNuevaVersion} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    Valor Medido ({ensayeEditar.unidadMedida}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formEnsaye.valor}
                    onChange={(e) => setFormEnsaye({ ...formEnsaye, valor: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl font-mono-num font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tipo de Ensaye *</label>
                  <select
                    value={formEnsaye.tipoEnsaye}
                    onChange={(e) => setFormEnsaye({ ...formEnsaye, tipoEnsaye: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl font-bold"
                  >
                    <option value="PROVISIONAL">PROVISIONAL</option>
                    <option value="FINAL">FINAL CERTIFICADO</option>
                    <option value="LABORATORIO_EXTERNO">LABORATORIO EXTERNO</option>
                    <option value="DIRIMENCIA">DIRIMENCIA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Estado de Medición *</label>
                  <select
                    value={formEnsaye.estadoMedicion}
                    onChange={(e) =>
                      setFormEnsaye({ ...formEnsaye, estadoMedicion: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl font-bold"
                  >
                    <option value="VALIDADO">VALIDADO</option>
                    <option value="MEDIDO">MEDIDO</option>
                    <option value="CERO_MEDIDO">CERO MEDIDO REAL (0.00)</option>
                    <option value="BAJO_LIMITE_DETECCION">BAJO LÍMITE DE DETECCIÓN</option>
                    <option value="NO_MEDIDO">NO MEDIDO (Excluido de ponderación)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">N.º Certificado *</label>
                  <input
                    type="text"
                    required
                    value={formEnsaye.nroCertificado}
                    onChange={(e) =>
                      setFormEnsaye({ ...formEnsaye, nroCertificado: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Laboratorio Emisor *</label>
                <input
                  type="text"
                  required
                  value={formEnsaye.laboratorio}
                  onChange={(e) => setFormEnsaye({ ...formEnsaye, laboratorio: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Motivo del Cambio / Emisión *</label>
                <input
                  type="text"
                  required
                  value={formEnsaye.motivoCambio}
                  onChange={(e) => setFormEnsaye({ ...formEnsaye, motivoCambio: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#CBD5E1] dark:border-[#1A364E]">
                <button
                  type="button"
                  onClick={() => setEnsayeEditar(null)}
                  className="px-4 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#1A364E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#041019] font-bold"
                >
                  Guardar Nueva Versión Auditada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer de Historial de Versiones del Ensaye */}
      <AnimatePresence>
        {ensayeHistorial && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-xs">
            <motion.div
              initial={{ x: 460 }}
              animate={{ x: 0 }}
              exit={{ x: 460 }}
              className="w-full max-w-md bg-white dark:bg-[#0A1622] h-full shadow-2xl border-l border-[#CBD5E1] dark:border-[#06B6D4] p-6 flex flex-col justify-between text-xs text-[#0F172A] dark:text-[#F8FAFC]"
            >
              <div className="space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#CBD5E1] dark:border-[#1A364E] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#0891B2] dark:text-[#22D3EE]">
                      HISTORIAL INMUTABLE DE VERSIONES DE LABORATORIO
                    </span>
                    <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {ensayeHistorial.numeroLote} · {ensayeHistorial.nombreLey}
                    </h2>
                  </div>
                  <button onClick={() => setEnsayeHistorial(null)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(ensayeHistorial.versiones || []).map((v: any) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE]">
                          Versión v{v.version} ({v.tipoEnsaye})
                        </span>
                        <span className="font-mono-num font-extrabold text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                          {v.valorStr} {ensayeHistorial.unidadMedida}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#334155] dark:text-[#94A3B8]">
                        Certificado: <strong>{v.nroCertificado}</strong> · Estado: {v.estadoMedicion}
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        Motivo: {v.motivoCambio} · Por: {v.usuarioNombre} ({formatearFechaBolivia(v.createdAt)})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

