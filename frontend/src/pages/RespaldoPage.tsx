import React, { useEffect, useRef, useState } from 'react';
import { DatabaseBackup, Download, Trash2, RotateCcw, Upload, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { apiFetch, API_BASE } from '../utils/api';

interface Respaldo {
  nombre: string;
  tamano: number;
  creadoEn: string;
}

function formatoTamano(b: number) {
  return b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

function formatoFecha(iso: string) {
  return new Date(iso).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' });
}

export function RespaldoPage() {
  const [respaldos, setRespaldos] = useState<Respaldo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [aRestaurar, setARestaurar] = useState<Respaldo | null>(null);
  const [confirmacion, setConfirmacion] = useState('');
  const inputArchivo = useRef<HTMLInputElement>(null);

  const cargar = async () => {
    try {
      const res = await apiFetch<{ respaldos: Respaldo[] }>('/api/respaldos');
      setRespaldos(res.respaldos);
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const crear = async () => {
    setTrabajando(true);
    setMensaje(null);
    try {
      const r = await apiFetch<{ nombre: string }>('/api/respaldos', { method: 'POST' });
      setMensaje({ tipo: 'ok', texto: 'Respaldo creado correctamente.' });
      await cargar();
      return r;
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setTrabajando(false);
    }
  };

  const descargar = async (r: Respaldo) => {
    const token = localStorage.getItem('mineralflow_token');
    const resp = await fetch(`${API_BASE}/api/respaldos/${r.nombre}/descargar`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    });
    if (!resp.ok) {
      setMensaje({ tipo: 'error', texto: 'No se pudo descargar el respaldo.' });
      return;
    }
    const url = URL.createObjectURL(await resp.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = r.nombre;
    a.click();
    URL.revokeObjectURL(url);
  };

  const eliminar = async (r: Respaldo) => {
    if (!window.confirm('¿Eliminar este respaldo? Esta acción no se puede deshacer.')) return;
    try {
      await apiFetch(`/api/respaldos/${r.nombre}`, { method: 'DELETE' });
      setMensaje({ tipo: 'ok', texto: 'Respaldo eliminado.' });
      await cargar();
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message });
    }
  };

  const restaurar = async () => {
    if (!aRestaurar) return;
    setTrabajando(true);
    try {
      await apiFetch(`/api/respaldos/${aRestaurar.nombre}/restaurar`, {
        method: 'POST',
        body: JSON.stringify({ confirmacion }),
      });
      setMensaje({ tipo: 'ok', texto: 'Datos restaurados. Antes se guardó un respaldo automático del estado anterior.' });
      setARestaurar(null);
      setConfirmacion('');
      await cargar();
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setTrabajando(false);
    }
  };

  const subirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    try {
      const contenido = JSON.parse(await archivo.text());
      await apiFetch('/api/respaldos/importar', { method: 'POST', body: JSON.stringify(contenido) });
      setMensaje({ tipo: 'ok', texto: 'Archivo cargado. Ya aparece en la lista para restaurarlo.' });
      await cargar();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'El archivo no es un respaldo válido.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC]">Respaldo de Datos</h1>
        <div className="flex flex-wrap gap-2">
          <input ref={inputArchivo} type="file" accept=".json,application/json" className="hidden" onChange={subirArchivo} data-testid="input-subir-respaldo" />
          <button
            type="button"
            onClick={() => inputArchivo.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC] text-sm font-bold hover:border-cyan-500 transition"
          >
            <Upload className="w-4 h-4 text-violet-500" /> Cargar archivo
          </button>
          <button
            type="button"
            onClick={crear}
            disabled={trabajando}
            data-testid="btn-crear-respaldo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-sm transition disabled:opacity-60"
          >
            <DatabaseBackup className="w-4 h-4" /> {trabajando ? 'Guardando...' : 'Crear respaldo ahora'}
          </button>
        </div>
      </div>

      {mensaje && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl flex items-center justify-between text-sm font-semibold border ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {mensaje.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {mensaje.texto}
          </span>
          <button onClick={() => setMensaje(null)} aria-label="Cerrar">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#CBD5E1] dark:border-[#1A364E] font-bold text-[#0F172A] dark:text-[#F8FAFC]">
          Respaldos guardados ({respaldos.length})
        </div>
        {cargando ? (
          <div className="p-8 text-center text-[#64748B]">Cargando...</div>
        ) : respaldos.length === 0 ? (
          <div className="p-10 text-center text-[#64748B] dark:text-[#94A3B8]">
            Aún no hay respaldos. Pulsa <strong>Crear respaldo ahora</strong>.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[#64748B] dark:text-[#94A3B8] border-b border-[#E2E8F0] dark:border-[#152E42]">
                <th>Fecha</th>
                <th>Archivo</th>
                <th>Tamaño</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {respaldos.map((r) => (
                <tr key={r.nombre} className="border-b border-[#E2E8F0] dark:border-[#152E42] last:border-0" data-testid={`fila-respaldo-${r.nombre}`}>
                  <td className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{formatoFecha(r.creadoEn)}</td>
                  <td className="font-mono-num text-[#64748B] dark:text-[#94A3B8]">{r.nombre}</td>
                  <td>{formatoTamano(r.tamano)}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => descargar(r)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold text-sm hover:bg-cyan-500/25">
                        <Download className="w-4 h-4" /> Descargar
                      </button>
                      <button onClick={() => { setARestaurar(r); setConfirmacion(''); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-sm hover:bg-amber-500/25">
                        <RotateCcw className="w-4 h-4" /> Restaurar
                      </button>
                      <button onClick={() => eliminar(r)} aria-label="Eliminar respaldo" className="p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/15">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {aRestaurar && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-7 max-w-md w-full space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Restaurar datos
            </h2>
            <p className="text-sm text-[#334155] dark:text-[#CBD5E1]">
              Se reemplazarán todos los datos actuales por los del respaldo del <strong>{formatoFecha(aRestaurar.creadoEn)}</strong>. Antes se guardará un respaldo automático.
            </p>
            <div>
              <label htmlFor="confirmar-restaurar" className="block text-sm font-semibold mb-1.5 text-[#0F172A] dark:text-[#F8FAFC]">
                Escribe RESTAURAR para continuar
              </label>
              <input
                id="confirmar-restaurar"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setARestaurar(null)} className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#1A364E] text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Cancelar
              </button>
              <button
                onClick={restaurar}
                disabled={confirmacion !== 'RESTAURAR' || trabajando}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 text-sm font-bold disabled:opacity-50"
              >
                {trabajando ? 'Restaurando...' : 'Restaurar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
