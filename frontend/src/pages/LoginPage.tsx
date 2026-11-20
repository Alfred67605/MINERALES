import React, { useState } from 'react';
import { Lock, User, Shield, AlertCircle, Film, ArrowRight, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useUIPreferences } from '../context/UIPreferencesContext';
import { MineralCrystalSvg, GeologicalStrataBannerSvg } from '../components/MineralGraphics';
import { HyperFramesModal } from '../components/HyperFramesModal';

export function LoginPage() {
  const { login } = useAuth();
  const { tema, setTema } = useUIPreferences();
  const [identificador, setIdentificador] = useState('admin');
  const [password, setPassword] = useState('DemoMineral2026!');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [hyperFramesAbierto, setHyperFramesAbierto] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(identificador, password);
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesión. Verifique sus credenciales.');
    } finally {
      setEnviando(false);
    }
  };

  const cuentasDemo = [
    { user: 'admin', rol: 'Administrador', desc: 'Control total, catálogos y auditoría' },
    { user: 'almacenero', rol: 'Almacenero', desc: 'Recepción, pesaje y lotes en almacén' },
    { user: 'vendedor', rol: 'Vendedor', desc: 'Selección 3D de lotes y cierre de ventas' },
    { user: 'laboratorio', rol: 'Laboratorio', desc: 'Certificados químicos y versionado' },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#060D14] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col justify-between relative overflow-hidden transition-colors">
      {/* Cabecera decorativa mineral */}
      <div className="w-full max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] flex items-center justify-center shadow-xs">
            <MineralCrystalSvg className="w-7 h-7" />
          </div>
          <div>
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] block leading-none">
              KOYOSIAT S.R.L.
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0891B2] dark:text-[#06B6D4]">
              Comercialización y Gestión de Minerales · Bolivia
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#0891B2] transition shadow-xs"
            title={tema === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {tema === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#0891B2]" />}
          </button>

          <button
            type="button"
            onClick={() => setHyperFramesAbierto(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#0A1622] text-[#0F172A] dark:text-[#F8FAFC] border border-[#CBD5E1] dark:border-[#1A364E] hover:border-[#0891B2] text-xs font-semibold shadow-xs transition"
          >
            <Film className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Presentación HyperFrames</span>
          </button>
        </div>
      </div>

      {/* Cuerpo principal dividido */}
      <div className="w-full max-w-6xl mx-auto px-6 my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center z-10">
        {/* Columna Izquierda: Identidad Minera Boliviana */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <Shield className="w-4 h-4" />
            <span>SISTEMA PARA COMERCIALIZADORAS DE MINERALES · BOLIVIA</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#0F172A] dark:text-[#F8FAFC] leading-[1.12] tracking-tight">
            Control fácil de compras, almacén y ventas de minerales.
          </h1>

          <p className="text-sm sm:text-base text-[#334155] dark:text-[#CBD5E1] max-w-xl leading-relaxed">
            Lleva el control claro de todos tus lotes desde que llegan de la mina hasta que se venden. Revisa sacos, pesos, leyes de laboratorio y precios del día al instante.
          </p>

          {/* Tarjetas de perfiles de prueba rápida */}
          <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#334155] dark:text-[#94A3B8]">
                Perfiles de Demostración (Clic para autocompletar)
              </span>
              <span className="text-[11px] font-mono-num text-amber-600 dark:text-amber-400 font-semibold">
                Clave: DemoMineral2026!
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {cuentasDemo.map((c) => {
                const activo = identificador === c.user;
                return (
                  <button
                    key={c.user}
                    type="button"
                    onClick={() => {
                      setIdentificador(c.user);
                      setPassword('DemoMineral2026!');
                      setError('');
                    }}
                    className={`text-left p-3 rounded-xl border transition ${activo
                        ? 'bg-cyan-50 dark:bg-cyan-950/40 border-[#0891B2] dark:border-[#06B6D4] ring-2 ring-[#0891B2]/20'
                        : 'bg-[#F8FAFC] dark:bg-[#060D14] border-[#CBD5E1] dark:border-[#1A364E] hover:border-[#0891B2]'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">{c.rol}</span>
                      <span className="text-[11px] font-mono-num font-semibold text-[#0891B2] dark:text-[#06B6D4] bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded">
                        @{c.user}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">{c.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Inicio de Sesión */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="lg:col-span-5 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-xl p-7 sm:p-8 transition-colors"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]">Iniciar Sesión</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
              Ingrese sus credenciales para acceder al sistema de operaciones.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-identificador"
                className="block text-xs font-bold text-[#334155] dark:text-[#94A3B8] mb-1.5"
              >
                Usuario o Correo Electrónico
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-identificador"
                  type="text"
                  required
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0891B2] dark:focus:border-[#06B6D4] focus:ring-2 focus:ring-[#0891B2]/15 transition"
                  placeholder="Ej. admin, almacenero, vendedor"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-[#334155] dark:text-[#94A3B8] mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0891B2] dark:focus:border-[#06B6D4] focus:ring-2 focus:ring-[#0891B2]/15 transition"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full py-3 px-4 rounded-xl bg-[#0891B2] dark:bg-[#06B6D4] hover:bg-[#0e7490] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-60"
            >
              <span>{enviando ? 'Verificando acceso...' : 'Ingresar a KOYOSIAT S.R.L.'}</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </form>
        </motion.div>
      </div>

      {/* Estratos geológicos inferiores */}
      <GeologicalStrataBannerSvg className="w-full h-24 shrink-0" />

      <HyperFramesModal
        abierto={hyperFramesAbierto}
        onClose={() => setHyperFramesAbierto(false)}
      />
    </div>
  );
}

