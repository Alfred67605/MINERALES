import React, { useState } from 'react';
import { Film, ShieldCheck, Database, Cpu, ExternalLink, Layers } from 'lucide-react';
import { HyperFramesModal } from '../components/HyperFramesModal';

export function AcercaPage() {
  const [modalHyperFrames, setModalHyperFrames] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            GUÍA RÁPIDA · CÓMO FUNCIONA EL SISTEMA PASO A PASO
          </span>
          <h1 className="font-display text-3xl sm:text-4xl text-slate-900 dark:text-[#F8FAFC] mt-0.5">
            Guía de Uso — MineralFlow 2.0
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-1 max-w-3xl">
            Sistema integral de recepción, control de laboratorio, almacén 3D, cotizaciones oficiales y en vivo, consolidación masiva de lotes y liquidación de ventas para comercializadoras de minerales en Bolivia.
          </p>
        </div>

        <button
          onClick={() => setModalHyperFrames(true)}
          data-testid="btn-abrir-hyperframes-acerca"
          className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#071320] hover:bg-[#0e7490] dark:bg-[#06B6D4] dark:hover:bg-[#0891B2] text-slate-50 dark:text-[#060D14] border border-[#0891B2]/50 dark:border-[#06B6D4] text-xs font-bold shadow-md transition shrink-0"
        >
          <Film className="w-4 h-4 text-amber-400 dark:text-[#060D14]" />
          <span>Ver Video Explicativo del Sistema</span>
        </button>
      </div>

      {/* Pilares Tecnológicos y Normativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-[#06B6D4]/20 text-[#0891B2] dark:text-[#22D3EE] flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
            Integridad Transaccional PostgreSQL 18
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            Almacenamiento exacto con columnas <code>DECIMAL(14,4)</code>, aislamiento <code>Serializable</code>, llave de idempotencia y snapshots históricos inmutables en cada liquidación.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-[#F59E0B]/20 text-amber-700 dark:text-[#F59E0B] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
            Motor Matemático Decimal.js & Norma ISO
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            Cálculo exacto de Peso Neto Húmedo (Bruto − Tara), Peso Seco por descuento de humedad (ISO 10251), leyes promedio ponderadas y cotizaciones oficiales quincenales (SENARECOM).
          </p>
        </div>

        <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-[#06B6D4]/20 text-amber-600 dark:text-[#22D3EE] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
            Visualización 3D Real + HyperFrames
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            Escenas interactivas con Three.js / React Three Fiber (Command Center, Almacén Conceptual y Agrupador de Venta) con degradación elegante a 2D y pieza audiovisual HyperFrames editable.
          </p>
        </div>
      </div>

      {/* Referencias Técnicas y Regulatorias Verificadas */}
      <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0891B2] dark:text-[#22D3EE]" />
          <span>Referencias Normativas y Técnicas Integradas</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {[
            {
              titulo: 'Formulario M-02 — Compra-Venta de Minerales y Metales',
              entidad: 'SENARECOM / Gob.bo (Asistencia documental interna)',
              url: 'https://www.gob.bo/tramites/formulario-m-02-formulario-de-compra-venta-de-minerales-y-metales',
            },
            {
              titulo: 'Trámites NIM / NIAR, M-02 y M-03',
              entidad: 'SENARECOM Bolivia',
              url: 'https://www.senarecom.gob.bo/index.php/lista-tramites-page/',
            },
            {
              titulo: 'ISO 12743:2021 — Procedimientos de muestreo para concentrados',
              entidad: 'International Organization for Standardization',
              url: 'https://www.iso.org/standard/81126.html',
            },
            {
              titulo: 'ISO 10251:2006 — Determinación de pérdida de masa por secado (Humedad)',
              entidad: 'International Organization for Standardization',
              url: 'https://www.iso.org/standard/41316.html',
            },
          ].map((ref) => (
            <a
              key={ref.url}
              href={ref.url}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#060D14] border border-slate-200 dark:border-[#1A364E] hover:border-[#0891B2] dark:hover:border-[#06B6D4] flex items-center justify-between gap-3 transition"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-[#F8FAFC]">{ref.titulo}</div>
                <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">{ref.entidad}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#0891B2] dark:text-[#22D3EE] shrink-0" />
            </a>
          ))}
        </div>
      </div>

      <HyperFramesModal
        abierto={modalHyperFrames}
        onClose={() => setModalHyperFrames(false)}
      />
    </div>
  );
}

