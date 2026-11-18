import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Sparkles, Layers, Scale, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ESCENAS = [
  {
    numero: 1,
    titulo: 'Extracción y Cristales Minerales',
    subtitulo: 'Origen trazable desde cooperativas y yacimientos andinos en Potosí, Oruro y La Paz.',
    duracionMs: 3200,
  },
  {
    numero: 2,
    titulo: 'Recepción de Lotes en Almacén',
    subtitulo: 'Cada lote ingresa con código único, sacos, peso neto exacto, leyes químicas y estado DISPONIBLE.',
    duracionMs: 3200,
  },
  {
    numero: 3,
    titulo: 'Agrupación Inteligente Multilote',
    subtitulo: 'Selección ágil de 10, 20 o 40+ lotes mediante casillas, filtros y rango Shift + Clic.',
    duracionMs: 3200,
  },
  {
    numero: 4,
    titulo: 'Cálculo Ponderado en Tiempo Real',
    subtitulo: 'Ley Promedio = Σ(Peso × Ley) / Σ(Peso) con precisión Decimal exacta y sin redondeo acumulado.',
    duracionMs: 3400,
  },
  {
    numero: 5,
    titulo: 'Cierre Atómico — MineralFlow',
    subtitulo: 'Transacción ACID en PostgreSQL, bloqueo contra doble venta e historial inmutable auditable.',
    duracionMs: 3600,
  },
];

export function HyperFramesModal({
  abierto,
  onClose,
}: {
  abierto: boolean;
  onClose: () => void;
}) {
  const [escenaActual, setEscenaActual] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(true);

  useEffect(() => {
    if (!abierto) {
      setEscenaActual(0);
      setReproduciendo(true);
      return;
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto || !reproduciendo) return;
    const timer = setTimeout(() => {
      if (escenaActual < ESCENAS.length - 1) {
        setEscenaActual((prev) => prev + 1);
      } else {
        setReproduciendo(false);
      }
    }, ESCENAS[escenaActual].duracionMs);

    return () => clearTimeout(timer);
  }, [abierto, reproduciendo, escenaActual]);

  if (!abierto) return null;

  const escena = ESCENAS[escenaActual];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Presentación Audiovisual HyperFrames — MineralFlow"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-4xl bg-slate-50 dark:bg-[#060D14] border border-[#0891B2]/40 dark:border-[#06B6D4]/40 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Barra superior de la composición HyperFrames */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#071320] dark:bg-[#060D14] text-slate-50 border-b border-slate-700 dark:border-[#1A364E]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono-num uppercase tracking-wider text-amber-300">
              HYPERFRAMES STUDIO COMPOSITION · 1920×1080 · 30 FPS
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Cerrar presentación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lienzo 16:9 de las 5 escenas */}
        <div className="relative h-[400px] sm:h-[440px] bg-gradient-to-br from-slate-50 dark:from-[#071320] via-slate-100 dark:via-[#0A1622] to-cyan-50 dark:to-[#0F2232] flex flex-col justify-between p-8 overflow-hidden">
          {/* Retícula técnica mineral de fondo */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(#06B6D4 1px, transparent 1px), radial-gradient(#F59E0B 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#0891B2] dark:bg-[#06B6D4] text-white">
              ESCENA {escena.numero} DE 5
            </span>
            <span className="text-xs font-mono-num text-slate-600 dark:text-[#94A3B8]">
              TIMELINE T = {(escenaActual * 3.2).toFixed(1)}s / 16.0s
            </span>
          </div>

          {/* Contenido visual dinámico por escena */}
          <div className="relative z-10 my-auto flex items-center justify-center min-h-[220px]">
            <AnimatePresence mode="wait">
              {escenaActual === 0 && (
                <motion.div
                  key="scene-1"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="flex items-center gap-6 mb-4">
                    {[
                      { label: 'Zn · Esfalerita', color: '#06B6D4' },
                      { label: 'Ag · Plata Nativa', color: '#F59E0B' },
                      { label: 'Sn · Casiterita', color: '#F43F5E' },
                    ].map((cristal, idx) => (
                      <motion.div
                        key={cristal.label}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.12 }}
                        className="bg-white/90 border border-[#0891B2]/40 dark:border-[#06B6D4]/40 rounded-xl p-4 shadow-md flex flex-col items-center w-36"
                      >
                        <svg viewBox="0 0 60 60" className="w-14 h-14 mb-2">
                          <polygon
                            points="30,4 52,18 46,48 30,56 14,48 8,18"
                            fill={cristal.color}
                            fillOpacity="0.18"
                            stroke={cristal.color}
                            strokeWidth="2"
                          />
                          <polygon
                            points="30,4 52,18 30,28 8,18"
                            fill={cristal.color}
                            fillOpacity="0.35"
                          />
                        </svg>
                        <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">{cristal.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {escenaActual === 1 && (
                <motion.div
                  key="scene-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-5 gap-2.5 max-w-xl w-full"
                >
                  {Array.from({ length: 15 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white dark:bg-[#0A1622] border border-[#0891B2]/30 dark:border-[#06B6D4]/40 rounded-lg p-2.5 shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE]">
                          LT-{101 + i}
                        </span>
                        <span className="w-2 h-2 rounded-full bg-[#0891B2] dark:bg-[#06B6D4]" />
                      </div>
                      <div className="text-[11px] font-mono-num text-slate-600 dark:text-[#94A3B8] mt-1">
                        {1200 + i * 50} kg
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#0891B2] dark:text-[#22D3EE] bg-cyan-50 dark:bg-[#06B6D4]/15 px-1.5 py-0.5 rounded mt-1 text-center">
                        DISPONIBLE
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {escenaActual === 2 && (
                <motion.div
                  key="scene-3"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-[#0A1622] border-2 border-[#0891B2] dark:border-[#06B6D4] rounded-2xl p-5 shadow-lg max-w-xl w-full"
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-[#1A364E]">
                    <span className="text-xs font-bold text-[#0891B2] dark:text-[#22D3EE] flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      SELECCIÓN POR RANGO SHIFT + CLIC ACTIVA
                    </span>
                    <span className="text-xs font-mono-num font-bold bg-[#0891B2] dark:bg-[#06B6D4] text-white px-2.5 py-0.5 rounded-full">
                      40 LOTES AGRUPADOS
                    </span>
                  </div>
                  <div className="grid grid-cols-8 gap-1.5">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0.4 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.015 }}
                        className="h-7 rounded bg-[#0891B2] dark:bg-[#06B6D4] text-white text-[10px] font-mono-num flex items-center justify-center font-semibold"
                      >
                        #{i + 1}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {escenaActual === 3 && (
                <motion.div
                  key="scene-4"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-3 gap-4 max-w-2xl w-full"
                >
                  <div className="bg-white dark:bg-[#0A1622] border border-[#0891B2]/40 dark:border-[#06B6D4]/40 rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 dark:text-[#94A3B8] font-semibold uppercase">Sacos Totales</div>
                    <div className="text-3xl font-mono-num font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">1.160</div>
                    <div className="text-xs text-[#0891B2] dark:text-[#22D3EE] mt-1 font-medium">40 Lotes verificados</div>
                  </div>
                  <div className="bg-white dark:bg-[#0A1622] border border-[#0891B2]/40 dark:border-[#06B6D4]/40 rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-slate-500 dark:text-[#94A3B8] font-semibold uppercase flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-amber-400" /> Peso Total Neto
                    </div>
                    <div className="text-3xl font-mono-num font-bold text-[#0891B2] dark:text-[#22D3EE] mt-1">
                      76.800 <span className="text-base">kg</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">Equivalente a 76,800 TM</div>
                  </div>
                  <div className="bg-[#0891B2] dark:bg-[#06B6D4] text-white rounded-xl p-4 shadow-md">
                    <div className="text-xs text-amber-300 font-semibold uppercase">Ley Promedio Ponderada</div>
                    <div className="text-3xl font-mono-num font-bold mt-1">46,67% Zn</div>
                    <div className="text-xs text-cyan-100 mt-1 font-mono-num">
                      Σ(Peso × Ley) / Σ(Peso)
                    </div>
                  </div>
                </motion.div>
              )}

              {escenaActual === 4 && (
                <motion.div
                  key="scene-5"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center max-w-xl"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0891B2] dark:bg-[#06B6D4] text-slate-50 shadow-lg mb-4">
                    <CheckCircle2 className="w-9 h-9 text-amber-300" />
                  </div>
                  <h2 className="font-display text-4xl sm:text-5xl text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                    MineralFlow Bolivia
                  </h2>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-1">
                    Gestión Inteligente de Lotes Mineros
                  </p>
                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-3">
                    Trazabilidad completa desde mina de origen hasta liquidación de venta con integridad ACID en PostgreSQL.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pie de escena con título y subtítulo */}
          <div className="relative z-10 bg-white/90 backdrop-blur-xs border border-slate-200 dark:border-[#1A364E] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">{escena.titulo}</h3>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5">{escena.subtitulo}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setReproduciendo((r) => !r)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0891B2] dark:bg-[#06B6D4] text-white hover:bg-[#0e7490] dark:hover:bg-[#22D3EE] transition"
              >
                {reproduciendo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {reproduciendo ? 'Pausar' : 'Reproducir'}
              </button>
              <button
                onClick={() => {
                  setEscenaActual(0);
                  setReproduciendo(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#0F2232] text-slate-900 dark:text-[#F8FAFC] hover:bg-slate-200 dark:hover:bg-[#162E44] transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            </div>
          </div>
        </div>

        {/* Selector de las 5 escenas en la línea de tiempo */}
        <div className="grid grid-cols-5 bg-slate-100 dark:bg-[#0F2232] border-t border-slate-200 dark:border-[#1A364E]">
          {ESCENAS.map((item, idx) => {
            const activa = idx === escenaActual;
            return (
              <button
                key={item.numero}
                onClick={() => {
                  setEscenaActual(idx);
                  setReproduciendo(false);
                }}
                className={`p-3 text-left border-r last:border-r-0 border-slate-200 dark:border-[#1A364E] transition ${
                  activa ? 'bg-white dark:bg-[#0A1622] border-t-2 border-t-[#06B6D4]' : 'hover:bg-white/60'
                }`}
              >
                <div className="text-[10px] font-mono-num font-bold text-amber-600 dark:text-amber-400">
                  ESCENA 0{item.numero}
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] truncate mt-0.5">
                  {item.titulo}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

