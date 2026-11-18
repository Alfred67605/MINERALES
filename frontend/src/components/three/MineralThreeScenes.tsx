import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, ContactShadows } from '@react-three/drei';
import { Box, Eye, EyeOff, RotateCcw, Layers, Sparkles } from 'lucide-react';
import { useUIPreferences, Calidad3D } from '../../context/UIPreferencesContext';
import { LoteItem, formatearNumeroBolivia } from '../../utils/calculations';

class WebGLErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function ThreeControlHeader({
  titulo,
  subtitulo,
  etiquetaConceptual,
  onResetCamera,
}: {
  titulo: string;
  subtitulo: string;
  etiquetaConceptual?: string;
  onResetCamera?: () => void;
}) {
  const { escenas3DActivas, setEscenas3DActivas, calidad3D, setCalidad3D } = useUIPreferences();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-[#0D1D2C] border-b border-slate-200 dark:border-[#1A364E]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#0891B2] dark:bg-[#06B6D4]/20 border border-[#06B6D4]/40 text-white dark:text-[#22D3EE] flex items-center justify-center shrink-0">
          <Box className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
              {titulo}
            </h3>
            {etiquetaConceptual && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-[#06B6D4]/15 text-[#0891B2] dark:text-[#22D3EE] border border-[#0891B2]/30 dark:border-[#06B6D4]/40">
                {etiquetaConceptual}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">{subtitulo}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {escenas3DActivas && (
          <select
            value={calidad3D}
            onChange={(e) => setCalidad3D(e.target.value as Calidad3D)}
            aria-label="Calidad gráfica 3D"
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-[#060D14] border border-slate-300 dark:border-[#1A364E] text-slate-800 dark:text-[#F8FAFC]"
          >
            <option value="auto">Calidad: Automática</option>
            <option value="high">Calidad: Alta (PBR)</option>
            <option value="low">Calidad: Baja (GPU Integrada)</option>
          </select>
        )}

        {escenas3DActivas && onResetCamera && (
          <button
            type="button"
            onClick={onResetCamera}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-[#060D14] border border-slate-300 dark:border-[#1A364E] text-slate-800 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#162E44] transition"
            title="Reiniciar cámara 3D"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#0891B2] dark:text-[#22D3EE]" />
            <span>Vista Inicial</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setEscenas3DActivas(!escenas3DActivas)}
          data-testid="btn-toggle-3d"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border transition ${
            escenas3DActivas
              ? 'bg-[#0891B2] dark:bg-[#06B6D4] text-white dark:text-[#041019] border-[#0891B2] dark:border-[#06B6D4]'
              : 'bg-white dark:bg-[#060D14] text-slate-800 dark:text-[#94A3B8] border-slate-300 dark:border-[#1A364E]'
          }`}
        >
          {escenas3DActivas ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{escenas3DActivas ? '3D Activado' : '3D Desactivado (Modo 2D)'}</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// ESCENA A — COMMAND CENTER 3D EN EL DASHBOARD
// ============================================================================
function CommandCenterCrystalMesh({
  lotesDisponibles,
  lotesVendidos,
  onSelectGroup,
  onHoverGroup,
}: {
  lotesDisponibles: number;
  lotesVendidos: number;
  onSelectGroup: (grupo: 'DISPONIBLE' | 'VENDIDO' | 'RECEPCION') => void;
  onHoverGroup: (grupo: 'DISPONIBLE' | 'VENDIDO' | 'RECEPCION' | null) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const crystalRef = useRef<any>(null);

  useFrame((state) => {
    if (crystalRef.current && state.clock.elapsedTime < 1.4) {
      crystalRef.current.rotation.y = state.clock.elapsedTime * 0.45;
    }
  });

  const dispHeight = Math.max(0.55, Math.min(2.2, lotesDisponibles / 25));
  const vendHeight = Math.max(0.35, Math.min(1.8, lotesVendidos / 10));

  return (
    <group position={[0, -0.35, 0]}>
      {/* Plataforma Base Geológica SCADA */}
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[3.4, 3.6, 0.25, 6]} />
        <meshStandardMaterial color="#0F2236" roughness={0.45} metalness={0.55} />
      </mesh>
      <gridHelper args={[14, 14, '#0891B2', '#132A42']} position={[0, -0.22, 0]} />

      {/* Núcleo Central: Cristal Mineral Isométrico */}
      <group
        ref={crystalRef}
        position={[0, 0.85, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectGroup('RECEPCION');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered('RECEPCION');
          onHoverGroup('RECEPCION');
        }}
        onPointerOut={() => {
          setHovered(null);
          onHoverGroup(null);
        }}
      >
        <mesh castShadow>
          <octahedronGeometry args={[0.98, 0]} />
          <meshStandardMaterial
            color={hovered === 'RECEPCION' ? '#22D3EE' : '#06B6D4'}
            roughness={0.18}
            metalness={0.65}
          />
        </mesh>
        <mesh scale={[1.05, 1.05, 1.05]}>
          <octahedronGeometry args={[0.98, 0]} />
          <meshBasicMaterial color="#F59E0B" wireframe />
        </mesh>
      </group>

      {/* Bloque Izquierdo: Stock Disponible en Almacén */}
      <group
        position={[-1.95, dispHeight / 2 - 0.2, 0.4]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectGroup('DISPONIBLE');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered('DISPONIBLE');
          onHoverGroup('DISPONIBLE');
        }}
        onPointerOut={() => {
          setHovered(null);
          onHoverGroup(null);
        }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.15, dispHeight, 1.15]} />
          <meshStandardMaterial
            color={hovered === 'DISPONIBLE' ? '#34D399' : '#10B981'}
            roughness={0.28}
            metalness={0.45}
          />
        </mesh>
      </group>

      {/* Bloque Derecho: Lotes Vendidos y Despachados */}
      <group
        position={[1.95, vendHeight / 2 - 0.2, 0.4]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectGroup('VENDIDO');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered('VENDIDO');
          onHoverGroup('VENDIDO');
        }}
        onPointerOut={() => {
          setHovered(null);
          onHoverGroup(null);
        }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.15, vendHeight, 1.15]} />
          <meshStandardMaterial
            color={hovered === 'VENDIDO' ? '#FB7185' : '#F43F5E'}
            roughness={0.32}
            metalness={0.35}
          />
        </mesh>
      </group>
    </group>
  );
}

export function CommandCenter3DScene({
  lotesDisponibles,
  lotesVendidos,
  pesoDisponibleKg,
  pesoVendidoKg,
  onNavigate,
}: {
  lotesDisponibles: number;
  lotesVendidos: number;
  pesoDisponibleKg: number;
  pesoVendidoKg: number;
  onNavigate: (ruta: string) => void;
}) {
  const { escenas3DActivas, calidad3D } = useUIPreferences();
  const [resetKey, setResetKey] = useState(0);
  const [hoveredGroup, setHoveredGroup] = useState<'DISPONIBLE' | 'VENDIDO' | 'RECEPCION' | null>(
    null
  );

  const handleGroupClick = (grupo: 'DISPONIBLE' | 'VENDIDO' | 'RECEPCION') => {
    if (grupo === 'DISPONIBLE') onNavigate('/almacen');
    else if (grupo === 'VENDIDO') onNavigate('/historial-ventas');
    else onNavigate('/compras');
  };

  const fallback2D = (
    <div className="p-5 bg-slate-50 dark:bg-[#060D14] grid grid-cols-1 sm:grid-cols-3 gap-4">
      <button
        type="button"
        onClick={() => handleGroupClick('RECEPCION')}
        className="p-4 rounded-xl bg-white dark:bg-[#0F2232] border border-slate-200 dark:border-[#1A364E] text-left hover:border-[#06B6D4] transition"
      >
        <span className="text-[11px] font-bold text-slate-500 dark:text-[#94A3B8] uppercase">
          Recepción Total
        </span>
        <div className="text-2xl font-mono-num font-extrabold text-slate-900 dark:text-[#F8FAFC] mt-1">
          {lotesDisponibles + lotesVendidos} Lotes
        </div>
        <span className="text-xs text-[#0891B2] dark:text-[#22D3EE] font-semibold mt-1 block">
          Ir a Compras →
        </span>
      </button>
      <button
        type="button"
        onClick={() => handleGroupClick('DISPONIBLE')}
        className="p-4 rounded-xl bg-cyan-50 dark:bg-[#06B6D4]/10 border border-[#0891B2]/30 dark:border-[#06B6D4]/40 text-left hover:border-[#06B6D4] transition"
      >
        <span className="text-[11px] font-bold text-[#0891B2] dark:text-[#22D3EE] uppercase">
          Stock Disponible
        </span>
        <div className="text-2xl font-mono-num font-extrabold text-[#0891B2] dark:text-[#22D3EE] mt-1">
          {lotesDisponibles} Lotes ({formatearNumeroBolivia(pesoDisponibleKg, 0)} kg)
        </div>
        <span className="text-xs text-[#0891B2] dark:text-[#22D3EE] font-semibold mt-1 block">
          Explorar Almacén →
        </span>
      </button>
      <button
        type="button"
        onClick={() => handleGroupClick('VENDIDO')}
        className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/40 text-left hover:border-rose-500 transition"
      >
        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
          Despachos Vendidos
        </span>
        <div className="text-2xl font-mono-num font-extrabold text-rose-600 dark:text-rose-400 mt-1">
          {lotesVendidos} Lotes ({formatearNumeroBolivia(pesoVendidoKg, 0)} kg)
        </div>
        <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1 block">
          Ver Expedientes →
        </span>
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl overflow-hidden shadow-sm">
      <ThreeControlHeader
        titulo="Vista 3D · Resumen de Tu Almacén y Ventas"
        subtitulo="Haz clic sobre cualquier bloque o botón inferior para ir directo a tus compras, tu almacén o tus ventas."
        onResetCamera={() => setResetKey((k) => k + 1)}
      />

      {!escenas3DActivas ? (
        fallback2D
      ) : (
        <WebGLErrorBoundary fallback={fallback2D}>
          <div className="h-64 sm:h-72 w-full bg-gradient-to-b from-[#071320] via-[#0B1D30] to-[#050C14] relative">
            <Canvas
              key={resetKey}
              shadows={calidad3D !== 'low'}
              dpr={calidad3D === 'low' ? 1 : [1, 1.75]}
              camera={{ position: [0, 2.5, 5.8], fov: 42 }}
            >
              <AdaptiveDpr pixelated />
              <ambientLight intensity={0.75} color="#BAE6FD" />
              <directionalLight position={[5, 8, 5]} intensity={1.3} color="#FFFFFF" castShadow={calidad3D !== 'low'} />
              <directionalLight position={[-4, 4, -3]} intensity={0.7} color="#06B6D4" />
              <pointLight position={[0, 3, 2]} intensity={0.5} color="#F59E0B" />
              <CommandCenterCrystalMesh
                lotesDisponibles={lotesDisponibles}
                lotesVendidos={lotesVendidos}
                onSelectGroup={handleGroupClick}
                onHoverGroup={setHoveredGroup}
              />
              {calidad3D !== 'low' && (
                <ContactShadows position={[0, -0.5, 0]} opacity={0.45} scale={9} blur={2} far={4} color="#000000" />
              )}
              <OrbitControls
                enablePan={false}
                minDistance={4}
                maxDistance={8.5}
                maxPolarAngle={Math.PI / 2.15}
              />
            </Canvas>

            {/* Marcadores HUD superpuestos */}
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleGroupClick('DISPONIBLE')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-num font-bold border shadow-sm backdrop-blur-xs transition ${
                  hoveredGroup === 'DISPONIBLE'
                    ? 'bg-emerald-400 text-slate-950 border-white'
                    : 'bg-emerald-600/90 text-white border-emerald-400/60'
                }`}
              >
                EN ALMACÉN: {lotesDisponibles} lotes ({formatearNumeroBolivia(pesoDisponibleKg, 0)} kg)
              </button>

              <button
                type="button"
                onClick={() => handleGroupClick('RECEPCION')}
                className="px-3.5 py-1.5 rounded-xl bg-[#0A1622]/90 text-[#F8FAFC] text-xs font-mono-num font-bold border border-amber-400/50 shadow-sm backdrop-blur-xs"
              >
                TOTAL LOTES: {lotesDisponibles + lotesVendidos}
              </button>

              <button
                type="button"
                onClick={() => handleGroupClick('VENDIDO')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono-num font-bold border shadow-sm backdrop-blur-xs transition ${
                  hoveredGroup === 'VENDIDO'
                    ? 'bg-amber-400 text-[#041019] border-white'
                    : 'bg-rose-600/90 text-white border-rose-400/50'
                }`}
              >
                VENDIDOS: {lotesVendidos} lotes ({formatearNumeroBolivia(pesoVendidoKg, 0)} kg)
              </button>
            </div>
          </div>
        </WebGLErrorBoundary>
      )}
    </div>
  );
}

// ============================================================================
// ESCENA B — ALMACÉN VIRTUAL / INVENTARIO 3D CONCEPTUAL
// ============================================================================
export function WarehouseInventory3DScene({
  lotes,
  onSelectLote,
}: {
  lotes: LoteItem[];
  onSelectLote: (lote: LoteItem) => void;
}) {
  const { escenas3DActivas, calidad3D } = useUIPreferences();
  const [loteHover, setLoteHover] = useState<LoteItem | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const lotesMuestra = lotes.slice(0, 60);
  const cols = 10;

  const fallback2D = (
    <div className="p-4 bg-slate-50 dark:bg-[#060D14] text-xs text-slate-600 dark:text-[#94A3B8]">
      Vista 2D activa: Usa la tabla de abajo para ver los {lotes.length} lotes y abrir sus detalles.
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl overflow-hidden shadow-sm">
      <ThreeControlHeader
        titulo="Vista 3D · Mapa de Lotes en Almacén"
        subtitulo="Pasa el mouse sobre cualquier caja para ver de quién es el lote, o haz clic para abrir su detalle."
        etiquetaConceptual="VISUALIZACIÓN POR TAMAÑO Y TIPO DE MINERAL"
        onResetCamera={() => setResetKey((k) => k + 1)}
      />

      {!escenas3DActivas ? (
        fallback2D
      ) : (
        <WebGLErrorBoundary fallback={fallback2D}>
          <div className="relative h-72 sm:h-80 w-full bg-gradient-to-b from-[#071320] via-[#0B1D30] to-[#050C14]">
            <Canvas
              key={resetKey}
              frameloop="demand"
              dpr={calidad3D === 'low' ? 1 : [1, 1.5]}
              camera={{ position: [0, 6.2, 8.5], fov: 42 }}
            >
              <AdaptiveDpr pixelated />
              <ambientLight intensity={0.85} color="#BAE6FD" />
              <directionalLight position={[6, 10, 6]} intensity={1.25} color="#FFFFFF" />
              <directionalLight position={[-5, 5, -4]} intensity={0.5} color="#06B6D4" />

              <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[14, 10]} />
                <meshStandardMaterial color="#0A192A" roughness={0.75} metalness={0.35} />
              </mesh>
              <gridHelper args={[14, 14, '#0891B2', '#132A42']} position={[0, -0.14, 0]} />

              {lotesMuestra.map((lote, idx) => {
                const row = Math.floor(idx / cols);
                const col = idx % cols;
                const x = (col - (cols - 1) / 2) * 1.1;
                const z = (row - 2.2) * 1.15;

                const h = Math.max(0.38, Math.min(1.25, lote.pesoKgEquivalente / 2200));
                const esDisponible = lote.estado === 'DISPONIBLE';
                const esEstano = lote.tipoMineral.toLowerCase().includes('estaño');
                const color = !esDisponible
                  ? '#F43F5E'
                  : esEstano
                  ? '#F59E0B'
                  : '#06B6D4';

                return (
                  <mesh
                    key={lote.id}
                    position={[x, h / 2, z]}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLote(lote);
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation();
                      setLoteHover(lote);
                    }}
                    onPointerOut={() => setLoteHover(null)}
                  >
                    <boxGeometry args={[0.78, h, 0.78]} />
                    <meshStandardMaterial
                      color={loteHover?.id === lote.id ? '#22D3EE' : color}
                      roughness={0.28}
                      metalness={0.4}
                    />
                  </mesh>
                );
              })}

              <OrbitControls
                enablePan={true}
                minDistance={4}
                maxDistance={14}
                maxPolarAngle={Math.PI / 2.1}
              />
            </Canvas>

            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="bg-[#0A1622]/90 backdrop-blur-xs border border-[#1A364E] rounded-xl px-3 py-1.5 text-[11px] flex items-center gap-3 shadow-xs text-[#F8FAFC]">
                <span className="flex items-center gap-1.5 font-semibold text-[#22D3EE]">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#06B6D4]" /> Disponible (Complejo Zn-Ag-Pb)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" /> Disponible (Estaño Sn)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#F43F5E]" /> Vendido
                </span>
                <span className="text-slate-400 hidden md:inline">
                  * Altura proporcional al rango de peso neto (no sustituye balanza).
                </span>
              </div>

              {loteHover && (
                <div className="bg-[#060D14]/95 text-white border border-[#06B6D4] rounded-xl px-3.5 py-2 text-xs shadow-lg">
                  <div className="font-mono-num font-bold text-[#22D3EE]">
                    {loteHover.numeroLote} · {loteHover.ubicacionCodigo || 'ZONA-A1'}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {loteHover.proveedorNombre} · {loteHover.cantidadSacos} sacos ·{' '}
                    {formatearNumeroBolivia(loteHover.pesoNeto, 2)} {loteHover.unidadPeso}
                  </div>
                </div>
              )}
            </div>
          </div>
        </WebGLErrorBoundary>
      )}
    </div>
  );
}

// ============================================================================
// ESCENA C — AGRUPADOR 3D DE VENTA (CONSOLIDACIÓN EN TIEMPO REAL)
// ============================================================================
export function SaleConsolidator3DScene({
  lotesSeleccionados,
  resumen,
}: {
  lotesSeleccionados: LoteItem[];
  resumen: any;
}) {
  const { escenas3DActivas, calidad3D } = useUIPreferences();
  const [resetKey, setResetKey] = useState(0);

  const cols = 8;

  const fallback2D = (
    <div className="p-4 bg-slate-50 dark:bg-[#060D14] flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="font-bold text-[#0891B2] dark:text-[#22D3EE] flex items-center gap-2">
        <Layers className="w-4 h-4" />
        <span>
          Bandeja de Consolidación (Modo 2D): {resumen.totalLotes} lotes agrupados ({resumen.totalSacos} sacos · {resumen.pesoTotalKgStr} kg)
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {resumen.promediosLeyes.map((pl: any) => (
          <span
            key={pl.codigoLey}
            className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#0F2232] border border-[#0891B2]/40 dark:border-[#06B6D4]/40 font-mono-num font-bold text-slate-900 dark:text-[#F8FAFC]"
          >
            {pl.simbolo}: {pl.leyPromedioRedondeada} {pl.unidadMedida} ({pl.coberturaPct}% cob.)
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] rounded-2xl overflow-hidden shadow-sm">
      <ThreeControlHeader
        titulo="Vista 3D · Lotes Seleccionados para Vender"
        subtitulo="Cada caja verde o azul representa un lote que vas a entregar en esta venta."
        onResetCamera={() => setResetKey((k) => k + 1)}
      />

      {!escenas3DActivas ? (
        fallback2D
      ) : (
        <WebGLErrorBoundary fallback={fallback2D}>
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 h-56 sm:h-64 bg-gradient-to-b from-[#071320] via-[#0B1D30] to-[#050C14] relative">
              <Canvas
                key={resetKey}
                frameloop="demand"
                dpr={calidad3D === 'low' ? 1 : [1, 1.5]}
                camera={{ position: [0, 4.8, 6.8], fov: 40 }}
              >
                <AdaptiveDpr pixelated />
                <ambientLight intensity={0.85} color="#BAE6FD" />
                <directionalLight position={[5, 8, 5]} intensity={1.2} color="#FFFFFF" />
                <directionalLight position={[-4, 5, -3]} intensity={0.5} color="#06B6D4" />

                <mesh position={[0, -0.12, 0]}>
                  <boxGeometry args={[8.4, 0.22, 5.8]} />
                  <meshStandardMaterial color="#0F2236" roughness={0.45} metalness={0.5} />
                </mesh>
                <gridHelper args={[10, 10, '#0891B2', '#132A42']} position={[0, 0.0, 0]} />

                {lotesSeleccionados.slice(0, 48).map((lote, idx) => {
                  const row = Math.floor(idx / cols);
                  const col = idx % cols;
                  const x = (col - (cols - 1) / 2) * 0.92;
                  const z = (row - 2.2) * 0.88;
                  const h = Math.max(0.35, Math.min(0.95, lote.pesoKgEquivalente / 2400));

                  return (
                    <mesh key={lote.id} position={[x, h / 2, z]}>
                      <boxGeometry args={[0.68, h, 0.68]} />
                      <meshStandardMaterial
                        color={idx % 2 === 0 ? '#06B6D4' : '#0891B2'}
                        roughness={0.28}
                        metalness={0.4}
                      />
                    </mesh>
                  );
                })}

                <OrbitControls enablePan={false} minDistance={3.5} maxDistance={11} />
              </Canvas>

              <div className="absolute top-2.5 left-3 px-2.5 py-1 rounded-lg bg-[#060D14]/90 border border-[#06B6D4]/50 text-[#22D3EE] text-[11px] font-mono-num font-bold">
                UNIDADES EN BANDEJA: {lotesSeleccionados.length} LOTES
              </div>
            </div>

            <div className="lg:col-span-5 p-4 bg-slate-50 dark:bg-[#0D1D2C] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-[#1A364E] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0891B2] dark:text-[#22D3EE] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Balance Físico y Fino Consolidado</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E]">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-[#94A3B8] block">
                      Peso Neto Húmedo
                    </span>
                    <span className="text-base font-mono-num font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                      {resumen.pesoTotalKgStr} kg
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E]">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-[#94A3B8] block">
                      Peso Neto Seco (ISO 10251)
                    </span>
                    <span className="text-base font-mono-num font-extrabold text-[#0891B2] dark:text-[#22D3EE]">
                      {resumen.pesoTotalSecoKgStr} kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 dark:text-[#94A3B8] uppercase block">
                  Ensayes Ponderados y Cobertura del Grupo:
                </span>
                {resumen.promediosLeyes.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-[#64748B]">
                    Marque uno o más lotes en la tabla para visualizar la consolidación 3D en vivo.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {resumen.promediosLeyes.map((pl: any) => (
                      <div
                        key={pl.codigoLey}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0A1622] border border-slate-200 dark:border-[#1A364E] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                            {pl.simbolo} ({pl.unidadMedida})
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">
                            Cobertura: {pl.lotesIncluidos}/{resumen.totalLotes} lotes ({pl.coberturaPct}%)
                          </span>
                        </div>
                        <div className="text-right font-mono-num">
                          <span className="font-extrabold text-[#0891B2] dark:text-[#22D3EE] text-sm">
                            {pl.leyPromedioRedondeada} {pl.unidadMedida}
                          </span>
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                            {pl.contenidoFino} {pl.unidadFino}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </WebGLErrorBoundary>
      )}
    </div>
  );
}
