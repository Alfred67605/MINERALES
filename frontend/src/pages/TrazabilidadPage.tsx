import React, { useEffect, useState } from 'react';
import {
  GitBranch,
  FileCheck2,
  ShieldAlert,
  Plus,
  ExternalLink,
  Search,
  CheckCircle2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  LoteItem,
  formatearFechaBolivia,
  formatearNumeroBolivia,
} from '../utils/calculations';

export function TrazabilidadPage() {
  const { tienePermiso } = useAuth();
  const puedeAdjuntar = tienePermiso('ADMINISTRADOR', 'ALMACENERO', 'VENDEDOR', 'LABORATORIO');

  const [lotes, setLotes] = useState<LoteItem[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<LoteItem | null>(null);
  const [cumplimientoData, setCumplimientoData] = useState<any>(null);
  const [busquedaLote, setBusquedaLote] = useState('');
  const [cargando, setCargando] = useState(true);

  const [modalDoc, setModalDoc] = useState(false);
  const [formDoc, setFormDoc] = useState({
    tipoDocumento: 'FORMULARIO_M02',
    numeroDocumento: 'M02-INT-2026-0900',
    estado: 'VERIFICADO',
    nombreArchivo: 'M02_respaldo_firmado.pdf',
    observaciones: '',
  });
  const [mensaje, setMensaje] = useState('');

  const cargarTodo = async () => {
    setCargando(true);
    try {
      const [resLotes, resCump] = await Promise.all([
        apiFetch<{ lotes: LoteItem[] }>('/api/lotes'),
        apiFetch<any>('/api/cumplimiento'),
      ]);
      setLotes(resLotes.lotes);
      setCumplimientoData(resCump);
      if (resLotes.lotes.length > 0 && !loteSeleccionado) {
        // Seleccionar por defecto un lote vendido o el primer disponible para mostrar la cadena completa
        const vendido = resLotes.lotes.find((l) => l.estado === 'VENDIDO') || resLotes.lotes[0];
        setLoteSeleccionado(vendido);
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const lotesFiltrados = lotes.filter((l) =>
    l.numeroLote.toLowerCase().includes(busquedaLote.toLowerCase()) ||
    l.proveedorNombre.toLowerCase().includes(busquedaLote.toLowerCase())
  );

  const registrarDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/cumplimiento/documentos', {
      method: 'POST',
      body: JSON.stringify({
        ...formDoc,
        loteId: loteSeleccionado?.id || null,
      }),
    });
    setMensaje('Documento de respaldo interno registrado en el expediente.');
    setModalDoc(false);
    await cargarTodo();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Trazabilidad y Normativa SENARECOM */}
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
            Seguimiento de Lotes
          </h1>
        </div>

        {puedeAdjuntar && (
          <button
            onClick={() => setModalDoc(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] text-white text-xs font-bold shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Registrar Respaldo M-02 / Boleto</span>
          </button>
        )}
      </div>

      {mensaje && (
        <div className="bg-cyan-50 dark:bg-[#06B6D4]/15 border border-[#0891B2] dark:border-[#06B6D4] text-[#0891B2] dark:text-[#22D3EE] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {mensaje}
          </span>
          <button onClick={() => setMensaje('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ESCENA D — GRAFO INTERACTIVO DE TRAZABILIDAD (Proveedor/Mina -> Recepción -> Lote -> Laboratorio -> Almacén -> Venta -> Comprador) */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-5 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1A364E] pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#0891B2] dark:text-[#22D3EE]" />
              <span>Recorrido del lote</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaLote}
                onChange={(e) => setBusquedaLote(e.target.value)}
                placeholder="Filtrar lote..."
                className="pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl w-40"
              />
            </div>

            <select
              value={loteSeleccionado?.id || ''}
              onChange={(e) => {
                const found = lotes.find((l) => l.id === e.target.value);
                if (found) setLoteSeleccionado(found);
              }}
              className="px-3 py-1.5 text-xs font-mono-num font-bold bg-[#0891B2] dark:bg-[#06B6D4] text-white rounded-xl"
            >
              {lotesFiltrados.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.numeroLote} ({l.estado}) — {l.proveedorCodigo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loteSeleccionado && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
            {[
              {
                paso: '01 · ORIGEN MINERO',
                titulo: loteSeleccionado.proveedorNombre,
                subtitulo: `Mina: ${loteSeleccionado.minaOrigen}`,
                meta: `NIM/NIAR: ${loteSeleccionado.proveedorNim || 'NIM-020010'}`,
                color: 'border-t-4 border-t-amber-500',
              },
              {
                paso: '02 · RECEPCIÓN & M-02',
                titulo: `Compra ${loteSeleccionado.numeroCompra}`,
                subtitulo: `Fecha: ${formatearFechaBolivia(loteSeleccionado.fechaCompra)}`,
                meta: `Exp: ${loteSeleccionado.expedienteM02Compra || 'M02-INT-2026'} (${loteSeleccionado.estadoM02Compra || 'RECIBIDO'})`,
                color: 'border-t-4 border-t-[#06B6D4]',
              },
              {
                paso: '03 · PESAJE BALANZA',
                titulo: `${formatearNumeroBolivia(loteSeleccionado.pesoNeto, 2)} ${loteSeleccionado.unidadPeso}`,
                subtitulo: `${loteSeleccionado.cantidadSacos} sacos · Seco: ${formatearNumeroBolivia(loteSeleccionado.pesoSeco || loteSeleccionado.pesoNeto, 2)} ${loteSeleccionado.unidadPeso}`,
                meta: `Boleto: ${loteSeleccionado.boletoPesaje || 'BOL-VERIFICADO'} (${loteSeleccionado.humedadPct || 0}% H₂O)`,
                color: 'border-t-4 border-t-[#0891B2]',
              },
              {
                paso: '04 · LABORATORIO',
                titulo: loteSeleccionado.tipoMineral,
                subtitulo: loteSeleccionado.leyes
                  .map((ll) => `${ll.simbolo}: ${ll.valorStr} ${ll.unidadMedida}`)
                  .join(' · '),
                meta: `Cert: ${loteSeleccionado.leyes[0]?.nroCertificado || 'CERT-LAB'} (ISO 12743)`,
                color: 'border-t-4 border-t-amber-500',
              },
              {
                paso: '05 · ALMACÉN FÍSICO',
                titulo: `Zona: ${loteSeleccionado.ubicacionCodigo || 'ZONA-A1'}`,
                subtitulo: loteSeleccionado.ubicacionNombre || 'Plataforma Norte',
                meta: `Estado actual: ${loteSeleccionado.estado}`,
                color: 'border-t-4 border-t-[#06B6D4]',
              },
              {
                paso: '06 · VENTA & DESTINO',
                titulo: loteSeleccionado.detalleVenta
                  ? `Venta ${loteSeleccionado.detalleVenta.numeroVenta}`
                  : 'En Stock Disponible',
                subtitulo: loteSeleccionado.detalleVenta
                  ? loteSeleccionado.detalleVenta.compradorNombre
                  : 'Disponible para consolidación inmediata',
                meta: loteSeleccionado.detalleVenta
                  ? `Liquidado: ${formatearFechaBolivia(loteSeleccionado.detalleVenta.fechaVenta)}`
                  : 'Sin venta asociada aún',
                color: loteSeleccionado.detalleVenta
                  ? 'border-t-4 border-t-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'border-t-4 border-t-slate-300 dark:border-t-[#1A364E]',
              },
            ].map((nodo) => (
              <div
                key={nodo.paso}
                className={`bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] ${nodo.color} rounded-xl p-3.5 flex flex-col justify-between`}
              >
                <div>
                  <span className="text-[10px] font-mono-num font-bold text-slate-500 dark:text-[#94A3B8] block">
                    {nodo.paso}
                  </span>
                  <div className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">{nodo.titulo}</div>
                  <div className="text-[11px] text-slate-600 dark:text-[#94A3B8] mt-1">{nodo.subtitulo}</div>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-[#1A364E] text-[10px] font-mono-num font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                  {nodo.meta}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tablas de Control Documental M-02 en Compras y Ventas */}
      {cumplimientoData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#0891B2] dark:text-[#22D3EE]" />
              <span>Control Interno M-02 y NIM/NIAR en Recepciones de Compra</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1A364E] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                    <th className="py-2 px-2">Compra</th>
                    <th className="py-2 px-2">Proveedor / NIM</th>
                    <th className="py-2 px-2">Expediente M-02</th>
                    <th className="py-2 px-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-[#1A364E]/60">
                  {cumplimientoData.comprasNormativas.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60">
                      <td className="py-2.5 px-2 font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE]">
                        {c.numeroCompra}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{c.proveedorNombre}</div>
                        <div className="text-[10px] font-mono-num text-slate-500 dark:text-[#94A3B8]">{c.nimNiar}</div>
                      </td>
                      <td className="py-2.5 px-2 font-mono-num">{c.expedienteM02}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE]">
                          {c.estadoM02}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Expedientes Documentales en Liquidaciones de Venta</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1A364E] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                    <th className="py-2 px-2">Venta</th>
                    <th className="py-2 px-2">Comprador</th>
                    <th className="py-2 px-2">Expediente M-02</th>
                    <th className="py-2 px-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-[#1A364E]/60">
                  {cumplimientoData.ventasNormativas.map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60">
                      <td className="py-2.5 px-2 font-mono-num font-bold text-amber-600 dark:text-amber-400">
                        {v.numeroVenta}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">{v.compradorNombre}</div>
                        <div className="text-[10px] font-mono-num text-slate-500 dark:text-[#94A3B8]">{v.compradorNit}</div>
                      </td>
                      <td className="py-2.5 px-2 font-mono-num">{v.expedienteM02}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE]">
                          {v.estadoM02}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Documento Normativo */}
      {modalDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A1622] border-2 border-[#0891B2]/50 dark:border-[#06B6D4]/50 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A364E] pb-3">
              <h2 className="text-base font-bold">Registrar Respaldo Documental Interno</h2>
              <button onClick={() => setModalDoc(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={registrarDocumento} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Tipo de Documento *</label>
                <select
                  value={formDoc.tipoDocumento}
                  onChange={(e) => setFormDoc({ ...formDoc, tipoDocumento: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-bold"
                >
                  <option value="FORMULARIO_M02">FORMULARIO M-02 (Compra-Venta Interna)</option>
                  <option value="BOLETO_PESAJE">BOLETO DE PESAJE BALANZA</option>
                  <option value="CERTIFICADO_LAB">CERTIFICADO DE LABORATORIO QUÍMICO</option>
                  <option value="NIM_NIAR">ACREDITACIÓN NIM / NIAR</option>
                  <option value="FORMULARIO_M03">FORMULARIO M-03 (Exportación Opcional)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">N.º o Código de Documento *</label>
                <input
                  type="text"
                  required
                  value={formDoc.numeroDocumento}
                  onChange={(e) => setFormDoc({ ...formDoc, numeroDocumento: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Nombre de Archivo PDF / Imagen</label>
                <input
                  type="text"
                  value={formDoc.nombreArchivo}
                  onChange={(e) => setFormDoc({ ...formDoc, nombreArchivo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Estado de Verificación</label>
                <select
                  value={formDoc.estado}
                  onChange={(e) => setFormDoc({ ...formDoc, estado: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-bold"
                >
                  <option value="PENDIENTE">PENDIENTE</option>
                  <option value="RECIBIDO">RECIBIDO</option>
                  <option value="VERIFICADO">VERIFICADO</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1A364E]">
                <button
                  type="button"
                  onClick={() => setModalDoc(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A364E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] text-white font-bold"
                >
                  Guardar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
