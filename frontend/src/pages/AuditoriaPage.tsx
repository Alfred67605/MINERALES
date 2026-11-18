import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Power,
  Search,
  KeyRound,
  Users,
  Shield,
  FileDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface PerfilDefinicion {
  rol: 'ADMINISTRADOR' | 'ALMACENERO' | 'VENDEDOR' | 'LABORATORIO' | 'CONSULTA';
  titulo: string;
  colorClase: string;
  bordeClase: string;
  permisos: string[];
}

const PERFILES: PerfilDefinicion[] = [
  {
    rol: 'ADMINISTRADOR',
    titulo: 'Administrador General',
    colorClase: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/40',
    bordeClase: 'border-t-4 border-t-cyan-500',
    permisos: ['Control total de módulos', 'Usuarios, roles y permisos', 'Copias de seguridad y restauración', 'Compras, almacén, ventas y reportes'],
  },
  {
    rol: 'ALMACENERO',
    titulo: 'Jefe de Almacén',
    colorClase: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    bordeClase: 'border-t-4 border-t-emerald-500',
    permisos: ['Registrar compras de mineral', 'Controlar sacos, pesos y zonas', 'Traslados internos y trazabilidad', 'Ver reportes e inventario'],
  },
  {
    rol: 'VENDEDOR',
    titulo: 'Ejecutivo de Ventas',
    colorClase: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40',
    bordeClase: 'border-t-4 border-t-violet-500',
    permisos: ['Agrupar lotes y calcular ventas en Bs', 'Cerrar ventas y emitir liquidaciones PDF', 'Gestionar compradores y cotizaciones', 'Ver reportes y estadísticas'],
  },
  {
    rol: 'LABORATORIO',
    titulo: 'Analista Químico',
    colorClase: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40',
    bordeClase: 'border-t-4 border-t-indigo-500',
    permisos: ['Registrar leyes químicas y certificados', 'Versionar ensayes y dirimencias', 'Adjuntar respaldos M-02 / ISO', 'Consultar almacén y laboratorio'],
  },
  {
    rol: 'CONSULTA',
    titulo: 'Auditor / Solo Lectura',
    colorClase: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40',
    bordeClase: 'border-t-4 border-t-amber-500',
    permisos: ['Visualizar dashboard y almacén', 'Consultar ventas, precios y reportes', 'Descargar reportes PDF y Excel', 'Sin permisos de edición'],
  },
];

export function AuditoriaPage() {
  const { usuario: usuarioActual } = useAuth();
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tab, setTab] = useState<'USUARIOS' | 'PERFILES' | 'AUDITORIA'>('USUARIOS');
  const [filtroRol, setFiltroRol] = useState<string>('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const [modalUsuario, setModalUsuario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<any | null>(null);
  const [formUser, setFormUser] = useState({
    nombre: '',
    email: '',
    username: '',
    password: '',
    rol: 'ALMACENERO',
    estado: 'ACTIVO',
  });
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resAud, resUsr] = await Promise.all([
        apiFetch<{ auditoria: any[] }>('/api/auditoria?limit=200'),
        apiFetch<{ usuarios: any[] }>('/api/usuarios'),
      ]);
      setAuditoria(resAud.auditoria);
      setUsuarios(resUsr.usuarios);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirNuevo = () => {
    setUsuarioEditando(null);
    setFormUser({
      nombre: '',
      email: '',
      username: '',
      password: '',
      rol: 'ALMACENERO',
      estado: 'ACTIVO',
    });
    setError('');
    setModalUsuario(true);
  };

  const abrirEditar = (u: any) => {
    setUsuarioEditando(u);
    setFormUser({
      nombre: u.nombre,
      email: u.email,
      username: u.username,
      password: '',
      rol: u.rol,
      estado: u.estado,
    });
    setError('');
    setModalUsuario(true);
  };

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (usuarioEditando) {
        const body: any = {
          nombre: formUser.nombre,
          email: formUser.email,
          rol: formUser.rol,
          estado: formUser.estado,
        };
        if (formUser.password.trim()) body.password = formUser.password;
        await apiFetch(`/api/usuarios/${usuarioEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        setExito(`Perfil de ${formUser.nombre} actualizado correctamente.`);
      } else {
        await apiFetch('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify(formUser),
        });
        setExito('Usuario creado correctamente con contraseña encriptada.');
      }
      setModalUsuario(false);
      await cargarDatos();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleEstadoUsuario = async (u: any) => {
    setError('');
    const nuevoEstado = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await apiFetch(`/api/usuarios/${u.id}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setExito(`Usuario ${u.username} marcado como ${nuevoEstado}.`);
      await cargarDatos();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroRol && u.rol !== filtroRol) return false;
      if (busqueda.trim()) {
        const b = busqueda.trim().toLowerCase();
        return (
          u.nombre.toLowerCase().includes(b) ||
          u.username.toLowerCase().includes(b) ||
          u.email.toLowerCase().includes(b) ||
          u.rol.toLowerCase().includes(b)
        );
      }
      return true;
    });
  }, [usuarios, filtroRol, busqueda]);

  const auditoriaFiltrada = useMemo(() => {
    if (!busqueda.trim()) return auditoria;
    const b = busqueda.trim().toLowerCase();
    return auditoria.filter(
      (a) =>
        a.usuarioNombre?.toLowerCase().includes(b) ||
        a.accion?.toLowerCase().includes(b) ||
        a.entidad?.toLowerCase().includes(b)
    );
  }, [auditoria, busqueda]);

  const exportarAuditoriaPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('MineralFlow Bolivia — Registro de Actividad y Usuarios', 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [['Fecha y Hora', 'Usuario', 'Acción', 'Entidad', 'Detalle']],
      body: auditoriaFiltrada.map((a) => [
        new Date(a.fechaHora).toLocaleString('es-BO'),
        a.usuarioNombre,
        a.accion,
        a.entidad,
        a.valorNuevo ? JSON.stringify(a.valorNuevo).slice(0, 80) : '-',
      ]),
      styles: { fontSize: 7.5 },
      headStyles: { fillColor: [8, 145, 178] },
    });
    doc.save('MineralFlow_Auditoria.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-500 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#0F172A] dark:text-[#F8FAFC]">
            Perfiles, Usuarios y Permisos
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {tab === 'AUDITORIA' && (
            <button
              type="button"
              onClick={exportarAuditoriaPDF}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC] text-xs font-bold hover:border-cyan-500 transition"
            >
              <FileDown className="w-4 h-4 text-cyan-500" />
              <span>Exportar PDF</span>
            </button>
          )}
          <button
            onClick={abrirNuevo}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] dark:bg-[#06B6D4] dark:hover:bg-[#0891B2] text-white dark:text-[#060D14] text-xs font-bold shadow-xs shrink-0 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Usuario</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Perfiles (5 Roles) con conteo y filtro rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {PERFILES.map((p) => {
          const count = usuarios.filter((u) => u.rol === p.rol).length;
          const activos = usuarios.filter((u) => u.rol === p.rol && u.estado === 'ACTIVO').length;
          const seleccionado = filtroRol === p.rol;
          return (
            <button
              key={p.rol}
              type="button"
              onClick={() => {
                setFiltroRol(seleccionado ? '' : p.rol);
                setTab('USUARIOS');
              }}
              className={`text-left bg-white dark:bg-[#0A1622] border rounded-2xl p-4 shadow-sm transition ${p.bordeClase} ${
                seleccionado
                  ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                  : 'border-[#CBD5E1] dark:border-[#1A364E] hover:border-cyan-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${p.colorClase}`}>
                  {p.rol}
                </span>
                <span className="font-mono-num text-sm font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                  {activos}/{count}
                </span>
              </div>
              <div className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-2">
                {p.titulo}
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 truncate">
                {p.permisos[0]}
              </div>
            </button>
          );
        })}
      </div>

      {exito && (
        <div className="bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {exito}
          </span>
          <button onClick={() => setExito('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pestañas + Buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab('USUARIOS')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'USUARIOS'
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#060D14]'
                : 'bg-white dark:bg-[#0A1622] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#1A364E]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios ({usuariosFiltrados.length})</span>
          </button>
          <button
            onClick={() => setTab('PERFILES')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'PERFILES'
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#060D14]'
                : 'bg-white dark:bg-[#0A1622] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#1A364E]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Matriz de Perfiles (5)</span>
          </button>
          <button
            onClick={() => setTab('AUDITORIA')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              tab === 'AUDITORIA'
                ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#060D14]'
                : 'bg-white dark:bg-[#0A1622] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#1A364E]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Registro de Actividad ({auditoriaFiltrada.length})</span>
          </button>
          {filtroRol && (
            <button
              onClick={() => setFiltroRol('')}
              className="px-3 py-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold"
            >
              Filtro: {filtroRol} ×
            </button>
          )}
        </div>

        {tab !== 'PERFILES' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={tab === 'USUARIOS' ? 'Buscar usuario, email o rol...' : 'Buscar acción o usuario...'}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC]"
            />
          </div>
        )}
      </div>

      {cargando ? (
        <div className="p-10 text-center text-[#64748B] bg-white dark:bg-[#0A1622] rounded-2xl border border-[#CBD5E1] dark:border-[#1A364E]">
          Cargando cuentas y permisos...
        </div>
      ) : tab === 'USUARIOS' ? (
        <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#060D14] border-b border-slate-200 dark:border-[#1A364E] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-3">Usuario</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Perfil / Rol</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1A364E]/70 text-xs">
                {usuariosFiltrados.map((u) => {
                  const pInfo = PERFILES.find((p) => p.rol === u.rol);
                  const esYo = usuarioActual?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#F8FAFC]">
                        {u.nombre} {esYo && <span className="text-cyan-500 text-[10px]">(Tú)</span>}
                      </td>
                      <td className="py-3 px-3 font-mono-num font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                        @{u.username}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-[#94A3B8]">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${pInfo?.colorClase || ''}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.estado === 'ACTIVO'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {u.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => abrirEditar(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold hover:bg-cyan-500/25 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          {!esYo && (
                            <button
                              onClick={() => toggleEstadoUsuario(u)}
                              title={u.estado === 'ACTIVO' ? 'Desactivar cuenta' : 'Activar cuenta'}
                              className={`p-1.5 rounded-lg transition ${
                                u.estado === 'ACTIVO'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
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
      ) : tab === 'PERFILES' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERFILES.map((p) => (
            <div
              key={p.rol}
              className={`bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] ${p.bordeClase} rounded-2xl p-5 shadow-sm space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${p.colorClase}`}>
                  {p.rol}
                </span>
                <span className="text-xs font-mono-num text-[#64748B] dark:text-[#94A3B8]">
                  {usuarios.filter((u) => u.rol === p.rol).length} cuenta(s)
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">{p.titulo}</h3>
              <ul className="space-y-1.5 text-xs text-[#334155] dark:text-[#CBD5E1]">
                {p.permisos.map((perm) => (
                  <li key={perm} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#060D14] border-b border-slate-200 dark:border-[#1A364E] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-3">Usuario</th>
                  <th className="py-3 px-3">Acción</th>
                  <th className="py-3 px-3">Entidad</th>
                  <th className="py-3 px-3">Detalle Nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1A364E]/70 text-xs">
                {auditoriaFiltrada.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60">
                    <td className="py-3 px-4 font-mono-num text-slate-600 dark:text-[#94A3B8] whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                      {new Date(a.fechaHora).toLocaleString('es-BO')}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-[#F8FAFC]">{a.usuarioNombre}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE] font-mono-num font-bold text-[11px]">
                        {a.accion}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-600 dark:text-[#94A3B8]">{a.entidad}</td>
                    <td className="py-3 px-3 font-mono-num text-[11px] text-slate-600 dark:text-[#94A3B8] max-w-md truncate">
                      {a.valorNuevo ? JSON.stringify(a.valorNuevo) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalUsuario && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A1622] border border-[#0891B2]/40 dark:border-[#06B6D4]/40 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1A364E] pb-3">
              <h2 className="text-base font-bold flex items-center gap-2 text-[#0F172A] dark:text-[#F8FAFC]">
                <ShieldCheck className="w-5 h-5 text-[#0891B2] dark:text-[#22D3EE]" />
                <span>{usuarioEditando ? `Editar Perfil: @${usuarioEditando.username}` : 'Registrar Nuevo Usuario'}</span>
              </h2>
              <button onClick={() => setModalUsuario(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={guardarUsuario} className="space-y-3">
              <div>
                <label className="block font-bold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formUser.nombre}
                  onChange={(e) => setFormUser({ ...formUser, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>
              {!usuarioEditando && (
                <div>
                  <label className="block font-bold mb-1">Nombre de Usuario *</label>
                  <input
                    type="text"
                    required
                    value={formUser.username}
                    onChange={(e) => setFormUser({ ...formUser, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-mono-num"
                  />
                </div>
              )}
              <div>
                <label className="block font-bold mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={formUser.email}
                  onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Perfil / Rol *</label>
                  <select
                    value={formUser.rol}
                    onChange={(e) => setFormUser({ ...formUser, rol: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-bold"
                  >
                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                    <option value="ALMACENERO">ALMACENERO</option>
                    <option value="VENDEDOR">VENDEDOR</option>
                    <option value="LABORATORIO">LABORATORIO</option>
                    <option value="CONSULTA">CONSULTA</option>
                  </select>
                </div>
                {usuarioEditando && (
                  <div>
                    <label className="block font-bold mb-1">Estado</label>
                    <select
                      value={formUser.estado}
                      onChange={(e) => setFormUser({ ...formUser, estado: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl font-bold"
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block font-bold mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>{usuarioEditando ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</span>
                </label>
                <input
                  type="password"
                  required={!usuarioEditando}
                  minLength={6}
                  value={formUser.password}
                  onChange={(e) => setFormUser({ ...formUser, password: e.target.value })}
                  placeholder={usuarioEditando ? '••••••••' : 'Mínimo 6 caracteres'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1A364E]">
                <button
                  type="button"
                  onClick={() => setModalUsuario(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A364E] font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] text-white font-bold"
                >
                  {usuarioEditando ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
