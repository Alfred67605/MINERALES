import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Database,
  Download,
  Trash2,
  RotateCcw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  Hourglass,
  Save,
  FileArchive,
  Lightbulb,
} from 'lucide-react';
import { apiFetch, API_BASE } from '../utils/api';

interface Respaldo {
  nombre: string;
  tamano: number;
  creadoEn: string;
  resumen?: Record<string, number>;
}

interface ProgramacionConfig {
  activo: boolean;
  frecuencia: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL' | 'DIARIO';
  hora: string;
}

function formatoTamano(b: number) {
  return b > 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(2)} KB`;
}

function formatoFechaExacta(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function calcularProximaEjecucion(cfg: ProgramacionConfig) {
  const ahora = new Date();
  const [hh, mm] = (cfg.hora || '23:30').split(':').map((n) => parseInt(n, 10) || 0);
  const proxima = new Date(ahora);
  proxima.setHours(hh, mm, 0, 0);

  let etiqueta = 'FIN DE MES';
  if (cfg.frecuencia === 'MENSUAL') {
    etiqueta = 'FIN DE MES';
    const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
    ultimoDia.setHours(hh, mm, 0, 0);
    if (ultimoDia <= ahora) {
      const sig = new Date(ahora.getFullYear(), ahora.getMonth() + 2, 0);
      sig.setHours(hh, mm, 0, 0);
      return {
        etiqueta,
        fechaStr: sig.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        horaStr: cfg.hora,
      };
    }
    return {
      etiqueta,
      fechaStr: ultimoDia.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      horaStr: cfg.hora,
    };
  }
  if (cfg.frecuencia === 'QUINCENAL') {
    etiqueta = 'CADA 15 DÍAS';
    const dia15 = new Date(ahora.getFullYear(), ahora.getMonth(), 15, hh, mm, 0, 0);
    const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, hh, mm, 0, 0);
    const target = dia15 > ahora ? dia15 : fin > ahora ? fin : new Date(ahora.getFullYear(), ahora.getMonth() + 1, 15, hh, mm, 0, 0);
    return {
      etiqueta,
      fechaStr: target.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      horaStr: cfg.hora,
    };
  }
  if (cfg.frecuencia === 'SEMANAL') {
    etiqueta = 'SEMANAL (DOMINGO)';
    const diff = (7 - ahora.getDay()) % 7 || 7;
    proxima.setDate(ahora.getDate() + diff);
  } else {
    etiqueta = 'TODOS LOS DÍAS';
    if (proxima <= ahora) proxima.setDate(ahora.getDate() + 1);
  }

  return {
    etiqueta,
    fechaStr: proxima.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    horaStr: cfg.hora,
  };
}

export function RespaldoPage() {
  const [respaldos, setRespaldos] = useState<Respaldo[]>([]);
  const [config, setConfig] = useState<ProgramacionConfig>({
    activo: true,
    frecuencia: 'MENSUAL',
    hora: '23:30',
  });
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState(false);
  const [guardandoCfg, setGuardandoCfg] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [aRestaurar, setARestaurar] = useState<Respaldo | null>(null);
  const [confirmacion, setConfirmacion] = useState('');
  const inputArchivo = useRef<HTMLInputElement>(null);

  const cargar = async () => {
    try {
      const [res, cfg] = await Promise.all([
        apiFetch<{ respaldos: Respaldo[] }>('/api/respaldos'),
        apiFetch<ProgramacionConfig>('/api/respaldos/programacion').catch(() => config),
      ]);
      setRespaldos(res.respaldos || []);
      if (cfg && cfg.frecuencia) setConfig(cfg);
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const proxima = useMemo(() => calcularProximaEjecucion(config), [config]);

  const guardarProgramacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoCfg(true);
    setMensaje(null);
    try {
      const updated = await apiFetch<ProgramacionConfig>('/api/respaldos/programacion', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      setConfig(updated);
      setMensaje({ tipo: 'ok', texto: 'Programación de respaldos automáticos guardada correctamente.' });
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setGuardandoCfg(false);
    }
  };

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
      {/* Cabecera estilo Backups Avanzados */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC]">
              Copias de Seguridad (Backups)
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <input ref={inputArchivo} type="file" accept=".json,application/json" className="hidden" onChange={subirArchivo} data-testid="input-subir-respaldo" />
          <button
            type="button"
            onClick={() => inputArchivo.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F1F5F9] dark:bg-[#0F2232] border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC] text-sm font-bold hover:border-amber-500 btn-tactile cursor-pointer"
          >
            <Upload className="w-4 h-4 text-amber-500" />
            <span>Subir & Restaurar</span>
          </button>
          <button
            type="button"
            onClick={crear}
            disabled={trabajando}
            data-testid="btn-crear-respaldo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-sm disabled:opacity-60 btn-tactile cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{trabajando ? 'Generando...' : 'Generar Respaldo Ahora'}</span>
          </button>
        </div>
      </div>

      {/* Recomendación de Seguridad */}
      <div className="bg-amber-50 dark:bg-[#0D1A28] border border-amber-400/50 dark:border-amber-500/30 border-l-4 border-l-amber-500 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="text-xs sm:text-sm text-[#334155] dark:text-[#CBD5E1]">
          <strong className="text-amber-700 dark:text-amber-400 block mb-0.5">
            RECOMENDACIÓN IMPORTANTE DE SEGURIDAD:
          </strong>
          Descarga tus copias de seguridad al menos una vez al mes y guárdalas en un disco externo, pendrive o en la nube para evitar pérdida de datos por fallas del equipo.
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

      {/* Programación de Respaldos Automáticos + Próxima Ejecución */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={guardarProgramacion}
          className="lg:col-span-8 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Programación de Respaldos Automáticos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8] block">
                Estado del Servicio
              </span>
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.activo}
                  onChange={(e) => setConfig({ ...config, activo: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-[#162E44] rounded-full peer peer-checked:bg-emerald-500 relative transition after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition peer-checked:after:translate-x-5" />
                <span className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Activar respaldos automáticos
                </span>
              </label>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Cuando está activo, el sistema programa copias completas de todos los lotes, leyes y ventas en segundo plano.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1.5">
                  Frecuencia de Ejecución
                </label>
                <select
                  value={config.frecuencia}
                  onChange={(e) => setConfig({ ...config, frecuencia: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC] font-semibold"
                >
                  <option value="MENSUAL">Mensual (Último día del mes)</option>
                  <option value="QUINCENAL">Quincenal (Día 15 y fin de mes)</option>
                  <option value="SEMANAL">Semanal (Cada domingo)</option>
                  <option value="DIARIO">Diario (Todos los días)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8] mb-1.5">
                  Hora del Respaldo
                </label>
                <input
                  type="time"
                  value={config.hora}
                  onChange={(e) => setConfig({ ...config, hora: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC] font-mono-num"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={guardandoCfg}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase shadow-sm transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{guardandoCfg ? 'Guardando...' : 'Guardar Programación'}</span>
            </button>
          </div>
        </form>

        {/* Tarjeta Próxima Ejecución */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col justify-between text-center">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
            <Hourglass className="w-4 h-4 text-amber-500" />
            <span>Próxima Ejecución</span>
          </div>

          <div className="my-6 space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase">
              <span className={`w-2.5 h-2.5 rounded-full ${config.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className={config.activo ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                {config.activo ? 'PROGRAMADO' : 'PAUSADO'}
              </span>
            </div>
            <div className="text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8]">
              {proxima.etiqueta}
            </div>
            <div className="text-3xl font-mono-num font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
              {config.activo ? proxima.fechaStr : '---'}
            </div>
            <div className="text-sm font-mono-num text-[#64748B] dark:text-[#94A3B8]">
              {config.activo ? `a las ${proxima.horaStr} hs` : 'Activa el servicio a la izquierda'}
            </div>
          </div>

          <div className="text-xs text-[#64748B] dark:text-[#94A3B8] border-t border-[#E2E8F0] dark:border-[#152E42] pt-3">
            El servidor preparará una copia íntegra de PostgreSQL en la fecha indicada.
          </div>
        </div>
      </div>

      {/* Historial de Respaldos Guardados */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#CBD5E1] dark:border-[#1A364E] flex items-center justify-between">
          <span className="font-bold text-xs uppercase text-[#64748B] dark:text-[#94A3B8]">
            Historial de Respaldos Guardados
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono-num font-bold text-xs">
            {respaldos.length} Archivo{respaldos.length === 1 ? '' : 's'}
          </span>
        </div>

        {cargando ? (
          <div className="p-8 text-center text-[#64748B]">Cargando...</div>
        ) : respaldos.length === 0 ? (
          <div className="p-10 text-center text-[#64748B] dark:text-[#94A3B8]">
            Aún no hay respaldos. Pulsa <strong>Generar Respaldo Ahora</strong>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#060D14] text-xs font-bold uppercase text-[#64748B] dark:text-[#94A3B8] border-b border-[#E2E8F0] dark:border-[#152E42]">
                  <th className="py-3 px-6">Archivo</th>
                  <th className="py-3 px-4">Fecha de Creación</th>
                  <th className="py-3 px-4">Registros</th>
                  <th className="py-3 px-4">Tamaño</th>
                  <th className="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#152E42]">
                {respaldos.map((r) => (
                  <tr key={r.nombre} className="hover:bg-slate-50 dark:hover:bg-[#0F2232]/50" data-testid={`fila-respaldo-${r.nombre}`}>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5 font-mono-num font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{r.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-[#334155] dark:text-[#CBD5E1]">
                      {formatoFechaExacta(r.creadoEn)}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {r.resumen
                        ? `${r.resumen.lote ?? 0} lotes · ${r.resumen.venta ?? 0} ventas · ${r.resumen.usuario ?? 0} usuarios`
                        : 'Completo'}
                    </td>
                    <td className="py-3.5 px-4 font-mono-num text-[#334155] dark:text-[#CBD5E1]">
                      {formatoTamano(r.tamano)}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => descargar(r)}
                          title="Descargar archivo"
                          aria-label="Descargar"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs hover:bg-amber-500/25"
                        >
                          <Download className="w-4 h-4" />
                          <span>Descargar</span>
                        </button>
                        <button
                          onClick={() => { setARestaurar(r); setConfirmacion(''); }}
                          title="Restaurar este respaldo"
                          aria-label="Restaurar"
                          className="p-2 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminar(r)}
                          title="Eliminar respaldo"
                          aria-label="Eliminar respaldo"
                          className="p-2 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/25"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {aRestaurar && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-7 max-w-md w-full space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Restaurar datos
            </h2>
            <p className="text-sm text-[#334155] dark:text-[#CBD5E1]">
              Se reemplazarán todos los datos actuales por los del respaldo del <strong>{formatoFechaExacta(aRestaurar.creadoEn)}</strong>. Antes se guardará un respaldo automático.
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
