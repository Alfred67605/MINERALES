import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PackagePlus,
  Warehouse,
  CheckSquare,
  History,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Search,
  ChevronRight,
  FlaskConical,
  GitBranch,
  DatabaseBackup,
  Bell,
  Rows3,
  Sun,
  Moon,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useUIPreferences } from '../context/UIPreferencesContext';
import { apiFetch } from '../utils/api';
import { TIPO_CAMBIO_OFICIAL_BOB, formatearNumeroBolivia } from '../utils/calculations';
import { MineralCrystalSvg } from './MineralGraphics';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario, logout, tienePermiso } = useAuth();
  const { tema, setTema, densidad, setDensidad } = useUIPreferences();
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [busquedaGlobal, setBusquedaGlobal] = useState('');
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const [tipoCambioDolar, setTipoCambioDolar] = useState<number>(TIPO_CAMBIO_OFICIAL_BOB);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    apiFetch<{ tipoCambio?: number }>('/api/cotizaciones')
      .then((res) => {
        if (res.tipoCambio) setTipoCambioDolar(res.tipoCambio);
      })
      .catch(() => {});
    const handler = (e: Event) => {
      const tc = (e as CustomEvent)?.detail?.tipoCambio;
      if (tc) setTipoCambioDolar(tc);
    };
    window.addEventListener('mf-dolar-actualizado', handler);
    return () => window.removeEventListener('mf-dolar-actualizado', handler);
  }, []);

  const gruposNavegacion = [
    {
      grupo: 'COMPRAS Y ALMACÉN',
      items: [
        {
          to: '/',
          label: 'Inicio / Resumen',
          icon: LayoutDashboard,
          iconColor: 'text-cyan-600 dark:text-cyan-400',
          descripcion: 'Estado actual de tu negocio',
          visible: true,
        },
        {
          to: '/compras',
          label: 'Registrar Compra',
          icon: PackagePlus,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          descripcion: 'Ingreso de mineral y sacos',
          visible: true,
        },
        {
          to: '/almacen',
          label: 'Mi Almacén',
          icon: Warehouse,
          iconColor: 'text-teal-600 dark:text-emerald-400',
          descripcion: 'Lotes guardados listos para vender',
          visible: true,
        },
      ],
    },
    {
      grupo: 'VENTAS Y PRECIOS',
      items: [
        {
          to: '/seleccion-venta',
          label: 'Vender Lotes',
          icon: CheckSquare,
          iconColor: 'text-violet-600 dark:text-violet-400',
          descripcion: 'Elige lotes y calcula tu venta',
          visible: true,
        },
        {
          to: '/cotizaciones',
          label: 'Precios de Minerales',
          icon: TrendingUp,
          iconColor: 'text-amber-600 dark:text-amber-400',
          descripcion: 'Oficiales, en vivo o manual',
          visible: true,
        },
        {
          to: '/historial-ventas',
          label: 'Ventas Realizadas',
          icon: History,
          iconColor: 'text-rose-600 dark:text-rose-400',
          descripcion: 'Recibos y descargas en PDF/Excel',
          visible: true,
        },
        {
          to: '/reportes',
          label: 'Reportes y Estadísticas',
          icon: BarChart3,
          iconColor: 'text-cyan-600 dark:text-cyan-400',
          descripcion: '',
          visible: true,
        },
        {
          to: '/catalogos',
          label: 'Proveedores y Clientes',
          icon: Users,
          iconColor: 'text-orange-600 dark:text-orange-400',
          descripcion: 'Minas, cooperativas y compradores',
          visible: true,
        },
      ],
    },
    {
      grupo: 'LABORATORIO Y CONTROL',
      items: [
        {
          to: '/laboratorio',
          label: 'Leyes de Laboratorio',
          icon: FlaskConical,
          iconColor: 'text-indigo-600 dark:text-indigo-400',
          descripcion: 'Análisis químico de cada lote',
          visible: true,
        },
        {
          to: '/trazabilidad',
          label: 'Seguimiento de Lotes',
          icon: GitBranch,
          iconColor: 'text-amber-600 dark:text-amber-400',
          descripcion: 'De qué mina vino y a quién se vendió',
          visible: true,
        },
      ],
    },
    {
      grupo: 'ADMINISTRACIÓN',
      items: [
        {
          to: '/auditoria',
          label: 'Usuarios y Permisos',
          icon: ShieldCheck,
          iconColor: 'text-cyan-600 dark:text-cyan-400',
          descripcion: 'Cuentas del personal y actividad',
          visible: tienePermiso('ADMINISTRADOR'),
        },
        {
          to: '/respaldo',
          label: 'Respaldo de Datos',
          icon: DatabaseBackup,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          descripcion: '',
          visible: tienePermiso('ADMINISTRADOR'),
        },
      ],
    },
  ];

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busquedaGlobal.trim()) return;
    navigate(`/almacen?q=${encodeURIComponent(busquedaGlobal.trim())}`);
  };

  const rolBadgeColor: Record<string, string> = {
    ADMINISTRADOR: 'bg-[#0891B2] dark:bg-[#06B6D4] text-white',
    ALMACENERO: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40',
    VENDEDOR: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40',
    LABORATORIO: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40',
    CONSULTA: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  };

  return (
    <div className="min-h-screen flex bg-[#F1F5F9] dark:bg-[#060D14] text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* Sidebar de Escritorio con Identidad de Producto */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarAbierto ? 304 : 80 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="hidden lg:flex flex-col bg-[#FFFFFF] dark:bg-[#0A1622] border-r border-[#CBD5E1] dark:border-[#1A364E] shrink-0 select-none z-30 no-print transition-colors"
      >
        {/* Cabecera de marca MineralFlow 2.0 */}
        <div className="h-18 px-4 flex items-center justify-between border-b border-[#CBD5E1] dark:border-[#1A364E] bg-[#F8FAFC] dark:bg-[#0D1D2C]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#06B6D4] flex items-center justify-center shrink-0 shadow-2xs">
              <MineralCrystalSvg className="w-7 h-7" />
            </div>
            {sidebarAbierto && (
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                    MineralFlow
                  </span>
                  <span className="text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#041019]">
                    2.0
                  </span>
                </div>
                <span className="text-[10px] font-bold tracking-wide text-[#0891B2] dark:text-[#22D3EE] block">
                  Control Minero Fácil
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarAbierto((s) => !s)}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#162E44] transition"
            title={sidebarAbierto ? 'Contraer panel lateral' : 'Expandir panel lateral'}
            aria-label={sidebarAbierto ? 'Contraer menú lateral' : 'Expandir menú lateral'}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Navegación Agrupada por Áreas con Colores Distintivos */}
        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto" aria-label="Navegación principal">
          {gruposNavegacion.map((seccion) => {
            const visibles = seccion.items.filter((i) => i.visible);
            if (visibles.length === 0) return null;

            return (
              <div key={seccion.grupo} className="space-y-1">
                {sidebarAbierto && (
                  <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    {seccion.grupo}
                  </div>
                )}
                {visibles.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.to);

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                        isActive
                          ? 'bg-gradient-to-r from-[#0891B2] to-[#06B6D4] text-white dark:text-[#041019] shadow-md border-l-4 border-l-amber-400 font-bold'
                          : 'text-[#334155] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#0F2232] hover:text-[#0F172A] dark:hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'text-white dark:text-[#041019]'
                            : item.iconColor
                        }`}
                      />
                      {sidebarAbierto && (
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold flex items-center justify-between gap-1.5">
                            <span className="truncate">{item.label}</span>
                            {item.to === '/almacen' && (
                              <span className={`shrink-0 text-[10px] font-mono-num font-bold px-2 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-white/25 text-white dark:bg-[#041019]/20 dark:text-[#041019]'
                                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              }`}>
                                45
                              </span>
                            )}
                            {item.to === '/cotizaciones' && (
                              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isActive
                                  ? 'bg-white/25 text-white dark:bg-[#041019]/20 dark:text-[#041019]'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              }`}>
                                Vivo
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {sidebarAbierto && isActive && (
                        <ChevronRight className="w-4 h-4 text-white dark:text-[#041019] shrink-0" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Tarjeta de Usuario Autenticado en pie de Sidebar */}
        <div className="p-3 border-t border-[#CBD5E1] dark:border-[#1A364E] bg-[#F8FAFC] dark:bg-[#0D1D2C]">
          {usuario && (
            <div className="bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl p-2.5 flex items-center justify-between gap-2">
              {sidebarAbierto && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                    {usuario.nombre}
                  </div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 ${
                      rolBadgeColor[usuario.rol] || 'bg-slate-200'
                    }`}
                  >
                    {usuario.rol}
                  </span>
                </div>
              )}
              <button
                onClick={logout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Menú Móvil Desplegable */}
      <AnimatePresence>
        {menuMovilAbierto && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40"
              onClick={() => setMenuMovilAbierto(false)}
            />
            <motion.div
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-72 bg-white dark:bg-[#0A1622] h-full flex flex-col z-10 shadow-xl border-r border-slate-200 dark:border-[#1A364E]"
            >
              <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-[#1A364E]">
                <div className="flex items-center gap-2.5">
                  <MineralCrystalSvg className="w-7 h-7" />
                  <span className="font-display text-xl font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                    MineralFlow 2.0
                  </span>
                </div>
                <button
                  onClick={() => setMenuMovilAbierto(false)}
                  className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400"
                  aria-label="Cerrar menú móvil"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
                {gruposNavegacion.map((sec) => (
                  <div key={sec.grupo} className="space-y-1">
                    <div className="px-2 text-[10px] font-bold uppercase text-slate-500 dark:text-[#94A3B8]">
                      {sec.grupo}
                    </div>
                    {sec.items
                      .filter((i) => i.visible)
                      .map((item) => {
                        const Icon = item.icon;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setMenuMovilAbierto(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold ${
                                isActive
                                  ? 'bg-gradient-to-r from-[#0891B2] to-[#06B6D4] text-white dark:text-[#041019]'
                                  : 'text-slate-700 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#0F2232]'
                              }`
                            }
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </NavLink>
                        );
                      })}
                  </div>
                ))}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Contenedor Principal + Topbar Ejecutiva */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-18 bg-white/95 dark:bg-[#0A1622]/95 backdrop-blur-md border-b border-[#CBD5E1] dark:border-[#1A364E] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 no-print transition-colors">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMenuMovilAbierto(true)}
              className="lg:hidden p-2 rounded-lg border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC]"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            <form onSubmit={handleGlobalSearch} className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={busquedaGlobal}
                onChange={(e) => setBusquedaGlobal(e.target.value)}
                placeholder="Buscar por número de lote (ej. LT-2026-0101), proveedor, mina o mineral..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-[#F1F5F9] dark:bg-[#060D14] border border-[#CBD5E1] dark:border-[#1A364E] rounded-xl text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0891B2] dark:focus:border-[#06B6D4] focus:ring-2 focus:ring-[#0891B2]/15 transition"
              />
            </form>
          </div>

          {/* Controles de Tema, Tabla, Vista 3D, Precios y Alertas con Colores Diferenciados */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Conmutador de Modo Oscuro / Claro */}
            <button
              type="button"
              onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
              data-testid="btn-toggle-theme"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20"
              title={tema === 'dark' ? 'Cambiar a Fondo Claro' : 'Cambiar a Fondo Azul Oscuro'}
            >
              {tema === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#0891B2]" />
                  <span className="hidden md:inline">Modo Oscuro</span>
                </>
              )}
            </button>

            {/* Selector de Densidad Visual: Cómodo / Compacto */}
            <button
              type="button"
              onClick={() =>
                setDensidad(densidad === 'comfortable' ? 'compact' : 'comfortable')
              }
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-50 dark:bg-violet-500/10 border border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition"
              title="Cambiar espacio entre filas en las tablas"
            >
              <Rows3 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>{densidad === 'comfortable' ? 'Tabla Cómoda' : 'Tabla Compacta'}</span>
            </button>

            {/* Acceso directo a Dólar Paralelo/BCB y Precios del Día */}
            <button
              type="button"
              onClick={() => navigate('/cotizaciones')}
              data-testid="btn-topbar-dolar"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono-num font-bold bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-400/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 transition"
              title="Tipo de cambio activo del Dólar (BCB / Paralelo) — Clic para cambiar"
            >
              <span>$US: {formatearNumeroBolivia(tipoCambioDolar, 2)} Bs</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/cotizaciones')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 shadow-xs transition"
              title="Ver y modificar precios de minerales"
            >
              <TrendingUp className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Precios del Día</span>
            </button>

            {/* Notificaciones operativas reales */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificacionesAbiertas((n) => !n)}
                className="p-2 rounded-xl bg-white dark:bg-[#0F2232] border border-[#CBD5E1] dark:border-[#1A364E] text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#0891B2] relative"
                aria-label="Avisos del sistema"
              >
                <Bell className="w-4 h-4 text-[#0891B2] dark:text-[#06B6D4]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
              </button>

              {notificacionesAbiertas && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0A1622] border border-[#CBD5E1] dark:border-[#1A364E] rounded-2xl shadow-xl p-4 z-50 text-xs space-y-2.5 text-[#0F172A] dark:text-[#F8FAFC]">
                  <div className="flex items-center justify-between border-b border-[#CBD5E1] dark:border-[#1A364E] pb-2">
                    <span className="font-bold">Resumen Rápido</span>
                    <button
                      onClick={() => setNotificacionesAbiertas(false)}
                      className="text-[#64748B]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    <strong>Precios Quincenales:</strong> Zinc $1.73/LF, Estaño $21.53/LF, Oro $4,010.22/OT.
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <strong>Tu Almacén:</strong> 45 lotes disponibles listos para vender.
                  </div>
                </div>
              )}
            </div>

            {usuario && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-[#CBD5E1] dark:border-[#1A364E]">
                <div className="text-right hidden xl:block">
                  <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">{usuario.nombre}</div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Cargo: {usuario.rol}</div>
                </div>
                <button
                  onClick={logout}
                  className="lg:hidden p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Salir del sistema"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1620px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
