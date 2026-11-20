import React, { memo } from 'react';
import { motion } from 'motion/react';

/**
 * Cristal Mineral Geométrico Tecnológico (Cyan / Oro Minero)
 */
export const MineralCrystalSvg = memo(function MineralCrystalSvg({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <polygon
        points="32,4 54,18 48,48 32,60 16,48 10,18"
        fill="#06B6D4"
        fillOpacity="0.16"
        stroke="#06B6D4"
        strokeWidth="2"
      />
      <polygon
        points="32,4 54,18 32,28 10,18"
        fill="#22D3EE"
        fillOpacity="0.28"
        stroke="#0891B2"
        strokeWidth="1.5"
      />
      <polygon
        points="32,28 54,18 48,48 32,60"
        fill="#0891B2"
        fillOpacity="0.24"
        stroke="#06B6D4"
        strokeWidth="1.5"
      />
      <line x1="32" y1="28" x2="32" y2="60" stroke="#F59E0B" strokeWidth="1.8" />
      <line x1="10" y1="18" x2="48" y2="48" stroke="#22D3EE" strokeWidth="1" strokeDasharray="2 2" />
      <circle cx="32" cy="28" r="3" fill="#F59E0B" />
    </svg>
  );
});

/**
 * Estratos Geológicos y Cordillera Andina para Cabeceras y Fondos
 */
export const GeologicalStrataBannerSvg = memo(function GeologicalStrataBannerSvg({ className = 'w-full h-24' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 95 L180 42 L340 78 L520 22 L710 68 L920 28 L1080 64 L1200 38 L1200 120 L0 120 Z"
        fill="#06B6D4"
        fillOpacity="0.07"
      />
      <path
        d="M0 105 L230 62 L430 88 L660 44 L860 82 L1040 48 L1200 74 L1200 120 L0 120 Z"
        fill="#0891B2"
        fillOpacity="0.09"
      />
      <motion.path
        d="M0 95 L180 42 L340 78 L520 22 L710 68 L920 28 L1080 64 L1200 38"
        stroke="#06B6D4"
        strokeOpacity="0.3"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: [0.165, 0.84, 0.44, 1] }}
      />
      <motion.path
        d="M0 108 L260 72 L520 94 L790 54 L1020 86 L1200 62"
        stroke="#F59E0B"
        strokeOpacity="0.32"
        strokeWidth="1.2"
        strokeDasharray="6 6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: [0.165, 0.84, 0.44, 1] }}
      />
    </svg>
  );
});

/**
 * Diagrama Vectorial Animado de Flujo de Entradas (Compras) -> Almacén -> Salidas (Ventas)
 */
export const WarehouseFlowDiagramSvg = memo(function WarehouseFlowDiagramSvg({
  disponibles,
  vendidos,
}: {
  disponibles: number;
  vendidos: number;
}) {
  return (
    <div className="relative bg-slate-50 dark:bg-[#071320] border border-slate-200 dark:border-[#1A364E] rounded-xl p-4 overflow-hidden">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          RECEPCIONES MINERAS
        </span>
        <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          STOCK ALMACÉN ({disponibles} LOTES)
        </span>
        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          VENTAS CONSOLIDADAS ({vendidos} LOTES)
        </span>
      </div>
      <svg viewBox="0 0 680 76" className="w-full h-16" aria-hidden="true">
        <line
          x1="95"
          y1="38"
          x2="275"
          y2="38"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <line
          x1="405"
          y1="38"
          x2="585"
          y2="38"
          stroke="#06B6D4"
          strokeWidth="2"
          strokeDasharray="5 5"
        />

        {/* Nodo 1: Minas / Proveedores */}
        <g transform="translate(16, 10)">
          <rect width="80" height="54" rx="8" fill="#0F2232" stroke="#F59E0B" strokeWidth="1.5" />
          <polygon points="22,42 40,16 58,42" fill="#F59E0B" fillOpacity="0.25" stroke="#F59E0B" strokeWidth="1.5" />
          <polygon points="36,42 48,24 62,42" fill="#06B6D4" fillOpacity="0.25" stroke="#06B6D4" strokeWidth="1.2" />
        </g>

        {/* Nodo 2: Almacén MineralFlow */}
        <g transform="translate(275, 6)">
          <rect width="130" height="62" rx="10" fill="#0891B2" />
          <rect x="16" y="18" width="24" height="16" rx="3" fill="#F8FAFC" fillOpacity="0.9" />
          <rect x="46" y="18" width="24" height="16" rx="3" fill="#F59E0B" />
          <rect x="76" y="18" width="24" height="16" rx="3" fill="#F8FAFC" fillOpacity="0.9" />
          <rect x="30" y="38" width="24" height="14" rx="3" fill="#F8FAFC" fillOpacity="0.7" />
          <rect x="62" y="38" width="24" height="14" rx="3" fill="#F59E0B" fillOpacity="0.9" />
        </g>

        {/* Nodo 3: Comprador / Despacho */}
        <g transform="translate(584, 10)">
          <rect width="80" height="54" rx="8" fill="#0F2232" stroke="#06B6D4" strokeWidth="1.5" />
          <path
            d="M22 30 L35 42 L58 18"
            stroke="#22D3EE"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
});

/**
 * Ilustración SVG para Estados Vacíos
 */
export const EmptyStateMineralSvg = memo(function EmptyStateMineralSvg({ mensaje = 'No se encontraron lotes con los criterios actuales' }: { mensaje?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <svg viewBox="0 0 120 100" className="w-28 h-24 mb-4" fill="none" aria-hidden="true">
        <ellipse cx="60" cy="84" rx="44" ry="8" fill="#0891B2" fillOpacity="0.18" />
        <polygon
          points="60,14 90,34 82,72 38,72 30,34"
          fill="#0F2232"
          fillOpacity="0.12"
          stroke="#06B6D4"
          strokeWidth="2"
        />
        <polygon
          points="60,14 90,34 60,46 30,34"
          fill="#06B6D4"
          fillOpacity="0.2"
          stroke="#0891B2"
          strokeWidth="1.5"
        />
        <line x1="60" y1="46" x2="60" y2="72" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{mensaje}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        Ajuste los términos de búsqueda o restaure los filtros para visualizar los registros disponibles en almacén.
      </p>
    </div>
  );
});
