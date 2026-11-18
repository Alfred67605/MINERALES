import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Plus,
  Search,
  Edit3,
  Eye,
  Power,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatearFechaBolivia, formatearNumeroBolivia } from '../utils/calculations';

export function CatalogosPage() {
  const { tienePermiso } = useAuth();
  const puedeEditarProveedores = tienePermiso('ADMINISTRADOR', 'ALMACENERO');
  const puedeEditarCompradores = tienePermiso('ADMINISTRADOR', 'VENDEDOR');

  const [tab, setTab] = useState<'PROVEEDORES' | 'MINAS' | 'COMPRADORES'>('PROVEEDORES');
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [minas, setMinas] = useState<any[]>([]);
  const [compradores, setCompradores] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [cargando, setCargando] = useState(true);

  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Modal Proveedor
  const [modalProveedor, setModalProveedor] = useState<any | null>(null);
  const [formProv, setFormProv] = useState({
    codigo: '',
    nombre: '',
    minaOrigen: '',
    telefono: '',
    observaciones: '',
    estado: 'ACTIVO',
  });

  // Modal Comprador
  const [modalComprador, setModalComprador] = useState<any | null>(null);
  const [formComp, setFormComp] = useState({
    codigo: '',
    nombre: '',
    identificacion: '',
    telefono: '',
    direccion: '',
    observaciones: '',
    estado: 'ACTIVO',
  });

  // Modal de historial de lotes suministrados o ventas realizadas
  const [historialEntidad, setHistorialEntidad] = useState<{
    tipo: 'PROVEEDOR' | 'COMPRADOR';
    datos: any;
  } | null>(null);

  const cargarCatalogos = async () => {
    setCargando(true);
    try {
      const query = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      const [resP, resC, resM] = await Promise.all([
        apiFetch<{ proveedores: any[] }>(`/api/proveedores${query}`),
        apiFetch<{ compradores: any[] }>(`/api/compradores${query}`),
        apiFetch<{ minas: any[] }>('/api/minas'),
      ]);
      setProveedores(resP.proveedores);
      setCompradores(resC.compradores);
      setMinas(resM.minas);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogos();
  }, [q]);

  const abrirNuevoProveedor = () => {
    setFormProv({
      codigo: `PROV-00${proveedores.length + 1}`,
      nombre: '',
      minaOrigen: '',
      telefono: '',
      observaciones: '',
      estado: 'ACTIVO',
    });
    setModalProveedor({ esNuevo: true });
  };

  const abrirEditarProveedor = (p: any) => {
    setFormProv({
      codigo: p.codigo,
      nombre: p.nombre,
      minaOrigen: p.minaOrigen || '',
      telefono: p.telefono || '',
      observaciones: p.observaciones || '',
      estado: p.estado,
    });
    setModalProveedor(p);
  };

  const guardarProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError('');
    try {
      if (modalProveedor.esNuevo) {
        await apiFetch('/api/proveedores', {
          method: 'POST',
          body: JSON.stringify(formProv),
        });
        setMensajeExito('Proveedor registrado correctamente.');
      } else {
        await apiFetch(`/api/proveedores/${modalProveedor.id}`, {
          method: 'PUT',
          body: JSON.stringify(formProv),
        });
        setMensajeExito('Proveedor actualizado correctamente.');
      }
      setModalProveedor(null);
      await cargarCatalogos();
    } catch (err: any) {
      setMensajeError(err.message);
    }
  };

  const toggleEstadoProveedor = async (p: any) => {
    const nuevoEstado = p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await apiFetch(`/api/proveedores/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setMensajeExito(`Proveedor ${p.codigo} marcado como ${nuevoEstado} (sin eliminar su historial).`);
      await cargarCatalogos();
    } catch (err: any) {
      setMensajeError(err.message);
    }
  };

  const abrirNuevoComprador = () => {
    setFormComp({
      codigo: `COMP-00${compradores.length + 1}`,
      nombre: '',
      identificacion: '',
      telefono: '',
      direccion: '',
      observaciones: '',
      estado: 'ACTIVO',
    });
    setModalComprador({ esNuevo: true });
  };

  const abrirEditarComprador = (c: any) => {
    setFormComp({
      codigo: c.codigo,
      nombre: c.nombre,
      identificacion: c.identificacion || '',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
      observaciones: c.observaciones || '',
      estado: c.estado,
    });
    setModalComprador(c);
  };

  const guardarComprador = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError('');
    try {
      if (modalComprador.esNuevo) {
        await apiFetch('/api/compradores', {
          method: 'POST',
          body: JSON.stringify(formComp),
        });
        setMensajeExito('Comprador registrado correctamente.');
      } else {
        await apiFetch(`/api/compradores/${modalComprador.id}`, {
          method: 'PUT',
          body: JSON.stringify(formComp),
        });
        setMensajeExito('Comprador actualizado correctamente.');
      }
      setModalComprador(null);
      await cargarCatalogos();
    } catch (err: any) {
      setMensajeError(err.message);
    }
  };

  const toggleEstadoComprador = async (c: any) => {
    const nuevoEstado = c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await apiFetch(`/api/compradores/${c.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setMensajeExito(`Comprador ${c.codigo} marcado como ${nuevoEstado} (conservando su historial).`);
      await cargarCatalogos();
    } catch (err: any) {
      setMensajeError(err.message);
    }
  };

  const verHistorialProveedor = async (id: string) => {
    const res = await apiFetch<{ proveedor: any }>(`/api/proveedores/${id}`);
    setHistorialEntidad({ tipo: 'PROVEEDOR', datos: res.proveedor });
  };

  const verHistorialComprador = async (id: string) => {
    const res = await apiFetch<{ comprador: any }>(`/api/compradores/${id}`);
    setHistorialEntidad({ tipo: 'COMPRADOR', datos: res.comprador });
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Módulo 8 */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            DIRECTORIO DE CONTACTOS · PROVEEDORES, MINAS Y CLIENTES
          </span>
          <h1 className="font-display text-3xl text-slate-900 dark:text-[#F8FAFC] mt-0.5">
            Proveedores, Minas y Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-1">
            Administra la lista de cooperativas mineras, minas de procedencia y empresas que te compran mineral.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {tab === 'PROVEEDORES' && puedeEditarProveedores && (
            <button
              onClick={abrirNuevoProveedor}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] dark:bg-[#06B6D4] dark:hover:bg-[#0891B2] text-white dark:text-[#060D14] text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4 text-amber-300 dark:text-[#060D14]" />
              <span>Nuevo Proveedor</span>
            </button>
          )}
          {tab === 'COMPRADORES' && puedeEditarCompradores && (
            <button
              onClick={abrirNuevoComprador}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] dark:bg-[#06B6D4] dark:hover:bg-[#0891B2] text-white dark:text-[#060D14] text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4 text-amber-300 dark:text-[#060D14]" />
              <span>Nuevo Comprador</span>
            </button>
          )}
        </div>
      </div>

      {mensajeExito && (
        <div className="bg-cyan-50 dark:bg-[#064E3B]/30 border border-[#0891B2]/40 dark:border-[#064E3B] text-[#0891B2] dark:text-[#34D399] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {mensajeExito}
          </span>
          <button onClick={() => setMensajeExito('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {mensajeError && (
        <div className="bg-rose-50 dark:bg-[#7F1D1D]/30 border border-rose-500/40 dark:border-[#7F1D1D] text-rose-700 dark:text-[#F87171] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {mensajeError}
          </span>
          <button onClick={() => setMensajeError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pestañas y Buscador */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('PROVEEDORES')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'PROVEEDORES'
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#060D14]'
                : 'bg-slate-100 dark:bg-[#0F2232] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white dark:hover:text-[#F8FAFC]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Proveedores ({proveedores.length})</span>
          </button>
          <button
            onClick={() => setTab('MINAS')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'MINAS'
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#060D14]'
                : 'bg-slate-100 dark:bg-[#0F2232] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white dark:hover:text-[#F8FAFC]'
            }`}
          >
            <span>Minas de Procedencia ({minas.length})</span>
          </button>
          <button
            onClick={() => setTab('COMPRADORES')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'COMPRADORES'
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#060D14]'
                : 'bg-slate-100 dark:bg-[#0F2232] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white dark:hover:text-[#F8FAFC]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Compradores ({compradores.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, razón social, mina o NIT..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#060D14] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#1A364E] rounded-xl focus:outline-hidden focus:border-[#06B6D4]"
          />
        </div>
      </div>

      {/* Tabla de Proveedores */}
      {tab === 'PROVEEDORES' && (
        <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#060D14] border-b border-slate-200 dark:border-[#1A364E] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-3">Nombre o Razón Social</th>
                  <th className="py-3 px-3">Mina de Origen</th>
                  <th className="py-3 px-3">Teléfono</th>
                  <th className="py-3 px-3 text-right">Lotes Suministrados</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1A364E]/70 text-xs">
                {proveedores.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60">
                    <td className="py-3 px-4 font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE]">
                      {p.codigo}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-[#F8FAFC]">{p.nombre}</div>
                      <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">{p.observaciones}</div>
                    </td>
                    <td className="py-3 px-3 font-medium">{p.minaOrigen || '-'}</td>
                    <td className="py-3 px-3 font-mono-num text-slate-600 dark:text-[#94A3B8]">{p.telefono || '-'}</td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold">
                      {p._count?.lotes || 0} lotes
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.estado === 'ACTIVO'
                            ? 'bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE]'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => verHistorialProveedor(p.id)}
                          className="p-1.5 rounded-lg text-[#0891B2] dark:text-[#22D3EE] hover:bg-cyan-50 dark:hover:bg-[#06B6D4]/15"
                          title="Consultar lotes suministrados"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {puedeEditarProveedores && (
                          <>
                            <button
                              onClick={() => abrirEditarProveedor(p)}
                              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/15"
                              title="Editar proveedor"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleEstadoProveedor(p)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-[#162E44]"
                              title={p.estado === 'ACTIVO' ? 'Desactivar proveedor' : 'Reactivar proveedor'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de Minas de Procedencia */}
      {tab === 'MINAS' && (
        <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#060D14] border-b border-slate-200 dark:border-[#1A364E] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                  <th className="py-3 px-4">Código Mina</th>
                  <th className="py-3 px-3">Yacimiento / Mina</th>
                  <th className="py-3 px-3">Departamento / Localidad</th>
                  <th className="py-3 px-3">Proveedor Asociado</th>
                  <th className="py-3 px-3 text-right">Lotes Extraídos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1A364E]/70 text-xs">
                {minas.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60">
                    <td className="py-3 px-4 font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE]">
                      {m.codigo}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-[#F8FAFC]">{m.nombre}</td>
                    <td className="py-3 px-3">
                      {m.departamento} — {m.localidad}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-[#94A3B8]">
                      {m.proveedor?.nombre || 'Independiente'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold">
                      {m._count?.lotes || 0} lotes
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla de Compradores */}
      {tab === 'COMPRADORES' && (
        <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#060D14] border-b border-slate-200 dark:border-[#1A364E] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-3">Empresa o Comprador</th>
                  <th className="py-3 px-3">NIT / Identificación</th>
                  <th className="py-3 px-3">Teléfono / Dirección</th>
                  <th className="py-3 px-3 text-right">Ventas Realizadas</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1A364E]/70 text-xs">
                {compradores.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60">
                    <td className="py-3 px-4 font-mono-num font-bold text-amber-600 dark:text-amber-400">
                      {c.codigo}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-[#F8FAFC]">{c.nombre}</div>
                      <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">{c.observaciones}</div>
                    </td>
                    <td className="py-3 px-3 font-mono-num font-semibold">
                      {c.identificacion || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono-num">{c.telefono || '-'}</div>
                      <div className="text-[11px] text-slate-500 dark:text-[#94A3B8]">{c.direccion}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num font-bold">
                      {c._count?.ventas || 0} ventas
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.estado === 'ACTIVO'
                            ? 'bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE]'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {c.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => verHistorialComprador(c.id)}
                          className="p-1.5 rounded-lg text-[#0891B2] dark:text-[#22D3EE] hover:bg-cyan-50 dark:hover:bg-[#06B6D4]/15"
                          title="Consultar ventas realizadas"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {puedeEditarCompradores && (
                          <>
                            <button
                              onClick={() => abrirEditarComprador(c)}
                              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/15"
                              title="Editar comprador"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleEstadoComprador(c)}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-[#162E44]"
                              title={c.estado === 'ACTIVO' ? 'Desactivar comprador' : 'Reactivar comprador'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Proveedor */}
      {modalProveedor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A1622] border border-[#0891B2]/40 dark:border-[#06B6D4]/40 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A364E] pb-3">
              <h2 className="text-base font-bold">
                {modalProveedor.esNuevo ? 'Registrar Proveedor Minero' : 'Editar Proveedor'}
              </h2>
              <button onClick={() => setModalProveedor(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={guardarProveedor} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={formProv.codigo}
                    onChange={(e) => setFormProv({ ...formProv, codigo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formProv.telefono}
                    onChange={(e) => setFormProv({ ...formProv, telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  required
                  value={formProv.nombre}
                  onChange={(e) => setFormProv({ ...formProv, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Mina de Origen</label>
                <input
                  type="text"
                  value={formProv.minaOrigen}
                  onChange={(e) => setFormProv({ ...formProv, minaOrigen: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Observaciones</label>
                <input
                  type="text"
                  value={formProv.observaciones}
                  onChange={(e) => setFormProv({ ...formProv, observaciones: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1A364E]">
                <button
                  type="button"
                  onClick={() => setModalProveedor(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A364E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] text-white font-bold"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Comprador */}
      {modalComprador && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A1622] border border-[#0891B2]/40 dark:border-[#06B6D4]/40 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A364E] pb-3">
              <h2 className="text-base font-bold">
                {modalComprador.esNuevo ? 'Registrar Comprador' : 'Editar Comprador'}
              </h2>
              <button onClick={() => setModalComprador(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={guardarComprador} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={formComp.codigo}
                    onChange={(e) => setFormComp({ ...formComp, codigo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">NIT / Identificación</label>
                  <input
                    type="text"
                    value={formComp.identificacion}
                    onChange={(e) => setFormComp({ ...formComp, identificacion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Nombre de Empresa o Comprador *</label>
                <input
                  type="text"
                  required
                  value={formComp.nombre}
                  onChange={(e) => setFormComp({ ...formComp, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formComp.telefono}
                    onChange={(e) => setFormComp({ ...formComp, telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formComp.direccion}
                    onChange={(e) => setFormComp({ ...formComp, direccion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Observaciones</label>
                <input
                  type="text"
                  value={formComp.observaciones}
                  onChange={(e) => setFormComp({ ...formComp, observaciones: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1A364E]">
                <button
                  type="button"
                  onClick={() => setModalComprador(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A364E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] text-white font-bold"
                >
                  Guardar Comprador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Consultar Lotes Suministrados o Ventas Realizadas */}
      {historialEntidad && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A1622] border border-[#0891B2]/40 dark:border-[#06B6D4]/40 rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A364E] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#0891B2] dark:text-[#22D3EE]">
                  {historialEntidad.tipo === 'PROVEEDOR'
                    ? 'HISTORIAL DE LOTES SUMINISTRADOS POR PROVEEDOR'
                    : 'HISTORIAL DE VENTAS REALIZADAS AL COMPRADOR'}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {historialEntidad.datos.codigo} — {historialEntidad.datos.nombre}
                </h2>
              </div>
              <button onClick={() => setHistorialEntidad(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {historialEntidad.tipo === 'PROVEEDOR' ? (
              <div className="space-y-2">
                {(historialEntidad.datos.lotes || []).map((l: any) => (
                  <div
                    key={l.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono-num font-bold text-slate-900 dark:text-[#F8FAFC]">
                        {l.numeroLote}
                      </span>{' '}
                      · <span>{l.tipoMineral}</span> ·{' '}
                      <span className="text-slate-500 dark:text-[#94A3B8]">
                        {formatearFechaBolivia(l.fechaCompra)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-num font-bold">
                        {l.cantidadSacos} sacos · {formatearNumeroBolivia(l.pesoNeto, 2)}{' '}
                        {l.unidadPeso}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.estado === 'DISPONIBLE'
                            ? 'bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE]'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {l.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {(historialEntidad.datos.ventas || []).map((v: any) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono-num font-bold text-amber-600 dark:text-amber-400">
                        {v.numeroVenta}
                      </span>{' '}
                      · <span>{formatearFechaBolivia(v.fecha)}</span>
                    </div>
                    <div className="font-mono-num font-bold">
                      {v.totalLotes} lotes · {v.totalSacos} sacos ·{' '}
                      {formatearNumeroBolivia(v.pesoTotalKg, 2)} kg
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

