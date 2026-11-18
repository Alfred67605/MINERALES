import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { apiFetch } from '../utils/api';

export function AuditoriaPage() {
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [tab, setTab] = useState<'AUDITORIA' | 'USUARIOS'>('AUDITORIA');
  const [cargando, setCargando] = useState(true);

  const [modalUsuario, setModalUsuario] = useState(false);
  const [formUser, setFormUser] = useState({
    nombre: '',
    email: '',
    username: '',
    password: '',
    rol: 'ALMACENERO',
  });
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resAud, resUsr] = await Promise.all([
        apiFetch<{ auditoria: any[] }>('/api/auditoria?limit=150'),
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

  const crearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/api/usuarios', {
        method: 'POST',
        body: JSON.stringify(formUser),
      });
      setExito('Usuario creado correctamente con contraseña encriptada.');
      setModalUsuario(false);
      await cargarDatos();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-slate-900 dark:text-[#F8FAFC] mt-0.5">
            Usuarios y Permisos
          </h1>
        </div>

        <button
          onClick={() => setModalUsuario(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0891B2] hover:bg-[#0e7490] dark:bg-[#06B6D4] dark:hover:bg-[#0891B2] text-white dark:text-[#060D14] text-xs font-bold shadow-xs shrink-0 transition"
        >
          <UserPlus className="w-4 h-4 text-amber-300 dark:text-[#060D14]" />
          <span>Registrar Usuario</span>
        </button>
      </div>

      {exito && (
        <div className="bg-cyan-50 dark:bg-[#064E3B]/30 border border-[#0891B2]/40 dark:border-[#064E3B] text-[#0891B2] dark:text-[#34D399] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {exito}
          </span>
          <button onClick={() => setExito('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-[#7F1D1D]/30 border border-rose-500/40 dark:border-[#7F1D1D] text-rose-700 dark:text-[#F87171] px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('AUDITORIA')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'AUDITORIA'
              ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#060D14]'
              : 'bg-white dark:bg-[#0A1622] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#1A364E]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Registro de Auditoría ({auditoria.length})</span>
        </button>
        <button
          onClick={() => setTab('USUARIOS')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            tab === 'USUARIOS'
              ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#060D14]'
              : 'bg-white dark:bg-[#0A1622] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#1A364E]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Usuarios del Sistema ({usuarios.length})</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-500/40 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-bold">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
          <button onClick={() => setError('')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab('AUDITORIA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold ${
            tab === 'AUDITORIA'
              ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white'
              : 'bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] text-slate-600 dark:text-[#94A3B8]'
          }`}
        >
          Bitácora de Auditoría ({auditoria.length})
        </button>
        <button
          onClick={() => setTab('USUARIOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold ${
            tab === 'USUARIOS'
              ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white'
              : 'bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] text-slate-600 dark:text-[#94A3B8]'
          }`}
        >
          Usuarios y Roles ({usuarios.length})
        </button>
      </div>

      {tab === 'AUDITORIA' ? (
        <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl shadow-2xs overflow-hidden">
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
                {auditoria.map((a) => (
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
      ) : (
        <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#060D14] border-b border-slate-200 dark:border-[#1A364E] text-[11px] font-bold uppercase text-slate-600 dark:text-[#94A3B8]">
                  <th className="py-3 px-4">Nombre</th>
                  <th className="py-3 px-3">Usuario</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Rol</th>
                  <th className="py-3 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-[#1A364E]/70 text-xs">
                {usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-100 dark:hover:bg-[#0F2232]/60">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-[#F8FAFC]">{u.nombre}</td>
                    <td className="py-3 px-3 font-mono-num font-semibold text-[#0891B2] dark:text-[#22D3EE]">
                      @{u.username}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-[#94A3B8]">{u.email}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#0F2232] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-[#1A364E]">
                        {u.rol}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE]">
                        {u.estado}
                      </span>
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
              <h2 className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0891B2] dark:text-[#22D3EE]" />
                <span>Registrar Nuevo Usuario</span>
              </h2>
              <button onClick={() => setModalUsuario(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={crearUsuario} className="space-y-3">
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
              <div>
                <label className="block font-bold mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formUser.password}
                  onChange={(e) => setFormUser({ ...formUser, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Rol de Acceso *</label>
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
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1A364E]">
                <button
                  type="button"
                  onClick={() => setModalUsuario(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A364E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] text-white font-bold"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

