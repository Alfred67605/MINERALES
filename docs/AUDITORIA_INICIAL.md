# AUDITORÍA INICIAL EXHAUSTIVA — MINERALFLOW (BASELINE v1.0 → v2.0)

**Fecha de auditoría:** 15 de noviembre de 2026  
**Entorno verificado:** Windows 11 · Node.js `v24.21.0` · PostgreSQL `18.6` (`localhost:5433/mineralflow`) · Fastify `5.2` · React `19` + Vite `6.4` + Tailwind CSS `4.0`.

---

## 1. Respaldo y Línea Base Verificada en PostgreSQL

Antes de cualquier modificación de código o esquema, se ejecutó un respaldo completo verificable con `pg_dump` en:
- `backups/mineralflow_pre_v2_backup.sql`

### Conteo exacto verificado en PostgreSQL (`SELECT estado, COUNT(*), SUM(cantidad_sacos), SUM(peso_kg)`):

| Estado en Base de Datos | Cantidad de Lotes | Total de Sacos | Peso Neto Equivalente (`kg`) |
|---|---|---|---|
| `DISPONIBLE` | **45** | **1.260** | **88.200,0000 kg** |
| `VENDIDO` | **6** | **195** | **11.280,0000 kg** |
| **TOTAL GLOBAL** | **51** | **1.455** | **99.480,0000 kg** |

Esta línea base coincide al 100% con los registros existentes y se preservará íntegramente durante las migraciones incrementales de MineralFlow 2.0.

---

## 2. Inventario de Agentes, Skills y Herramientas Instaladas

### Skills inspeccionadas (`SKILL.md` leídos y aplicados):
1. `find-skills` (`C:\Users\llano\.gemini\config\skills\find-skills\SKILL.md`)
2. `frontend-design` (`C:\Users\llano\.gemini\config\skills\frontend-design\SKILL.md`)
3. `ui-ux-pro-max` (`C:\Users\llano\.gemini\config\skills\ui-ux-pro-max\SKILL.md`)
4. `web-animation-design` (`C:\Users\llano\.gemini\config\skills\web-animation-design\SKILL.md`)
5. `vercel-react-best-practices` (`C:\Users\llano\.gemini\config\skills\vercel-react-best-practices\SKILL.md`)
6. `vercel-composition-patterns` (`C:\Users\llano\.gemini\config\skills\vercel-composition-patterns\SKILL.md`)
7. `supabase-postgres-best-practices` (`C:\Users\llano\.gemini\config\skills\supabase-postgres-best-practices\SKILL.md`)
8. `security-review` (`C:\Users\llano\.gemini\config\skills\security-review\SKILL.md`)
9. `playwright-cli` (`C:\Users\llano\.gemini\config\skills\playwright-cli\SKILL.md`)
10. `verification-before-completion` (`C:\Users\llano\.gemini\config\skills\verification-before-completion\SKILL.md`)
11. `hyperframes` y `hyperframes-cli` (`C:\Users\llano\.gemini\config\skills\hyperframes\SKILL.md`, `references/spec.md`, `references/motion.md`)

---

## 3. Hallazgos de Auditoría Clasificados por Prioridad (P0 / P1 / P2)

| ID | Prioridad | Módulo / Área | Evidencia Detectada en v1.0 | Causa Raíz | Impacto Operativo / Visual | Propuesta de Solución en v2.0 | Test de Aceptación |
|---|---|---|---|---|---|---|---|
| **AUD-01** | **P0** | Motor Matemático y Pesaje (Módulos 2, 5 y 6) | Solo se registraba `pesoNeto` directo sin desglosar `pesoBrutoHumedo`, `tara`, `humedadPct`, `pesoNetoSeco` ni cálculo de contenido fino (`kg` para `%` y `g` para `g/t`). | Modelo inicial enfocado solo en peso neto simple. | En operación minera real (ISO 10251 / ISO 12743) se requiere boleto de pesaje (Bruto − Tara = Neto Húmedo) y descuento de humedad para obtener Peso Seco y contenido fino. | Ampliar modelo y motor `calculations.ts` con soporte completo para Bruto, Tara, Humedad, Peso Seco, Contenido Fino (`kg`/`g`), criterio de base explícito (`PESO_NETO_HUMEDO` vs `PESO_SECO`) e indicador de cobertura (`X/N lotes`). | Test unitario Vitest verificando `Bruto - Tara`, `Peso Seco = Húmedo * (1 - Humedad/100)` y cobertura parcial sin asumir `0`. |
| **AUD-02** | **P0** | Idempotencia en Cierre de Venta (Módulo 6) | Aunque existe aislamiento `Serializable` y `UNIQUE(lote_id)`, no existía soporte explícito para `idempotencyKey` ante reintentos de red o doble envío con la misma llave de operación. | Falta de columna `idempotency_key` en tabla `ventas`. | Una petición reintentada por corte de red podría devolver error en vez de la respuesta idempotente de la operación ya creada, o requerir manejo manual. | Añadir columna `idempotency_key UNIQUE` en `ventas` y soporte en `POST /api/ventas` para devolver la venta existente si se repite la misma llave idempotente. | Test de integración Vitest enviando dos solicitudes con la misma `idempotencyKey` y dos ventas concurrentes sobre un mismo lote. |
| **AUD-03** | **P1** | Visualización 3D Real e Interactiva (Dashboard, Almacén, Venta) | En v1.0 las visualizaciones eran únicamente gráficos 2D y esquemas SVG planos; carecía de escenas 3D interactivas con Three.js / React Three Fiber. | Ausencia de motor 3D WebGL e interacción espacial. | Menor diferenciación visual y falta de representación espacial para Command Center, Almacén Virtual y Agrupador 3D de Venta. | Integrar `three`, `@react-three/fiber` y `@react-three/drei` con **Escena A (Command Center 3D)**, **Escena B (Almacén Virtual 3D Conceptual etiquetado)**, **Escena C (Agrupador 3D de Venta)** y **Escena D (Grafo de Trazabilidad Interactiva)** con controles `3D Activado/Desactivado`, calidad adaptativa y fallback 2D. | Prueba E2E Playwright verificando renderizado de escenas 3D y funcionamiento al 100% con 3D desactivado. |
| **AUD-04** | **P1** | Laboratorio, Versionado de Ensayes y Estados de Validación | La tabla `lote_leyes` guardaba un único valor plano por ley sin distinguir tipo de ensaye (`PROVISIONAL`, `FINAL`, `DIRIMENCIA`), laboratorio, certificado, estado (`SIN_DATO`, `NO_MEDIDO`, `BAJO_LIMITE_DETECCION`, `CERO_MEDIDO`, `VALIDADO`) ni historial de versiones. | Falta de entidades de laboratorio y versionado. | En comercialización minera real se reciben ensayes provisionales y luego certificados finales de laboratorio; además debe diferenciarse una ley no medida de un cero medido. | Extender `lote_leyes` con metadatos de laboratorio/estado y crear tablas `ensaye_versiones`, `certificados_laboratorio` y módulo dedicado **Laboratorio y Ensayes**. | Test de integración verificando actualización de ensaye con historial de versiones y bloqueo en ventas cerradas. |
| **AUD-05** | **P1** | Trazabilidad Física, Kardex y Normativa Boliviana (SENARECOM M-02 / NIM / NIAR) | No existía bitácora de movimientos de almacén (`Kardex`), ubicaciones opcionales ni registro de asistencia documental interna para **Formulario M-02**, **NIM/NIAR** o **M-03**. | Alcance inicial limitado a compras/ventas básicas. | Las comercializadoras bolivianas requieren controlar el estado documental interno de M-02, NIM/NIAR y boletos de pesaje por cada compra/venta. | Añadir tablas `minas`, `ubicaciones_almacen`, `movimientos_inventario`, `documentos_cumplimiento` y vistas de Kardex, Trazabilidad y Asistencia Documental SENARECOM (claramente marcada como control interno). | Prueba funcional de registro y verificación de expediente documental M-02 y Kardex de movimientos. |
| **AUD-06** | **P2** | Jerarquía Visual, Navegación, Drawers y Ubicación de HyperFrames | 1) El botón "Composición HyperFrames" aparecía como herramienta técnica fija en la cabecera del Dashboard y en el pie del sidebar. 2) Los nombres de usuarios tenían el sufijo `(DEMO)` en sesión. 3) Exceso de modales centrados en lugar de Drawers laterales y Stepper/Wizards. 4) Tablas con textos pequeños y proveedores truncados. | Decisiones de maquetación de la primera iteración. | Resta sobriedad a la operación diaria y dificulta la lectura en monitores de 1366px / 1440px / 1720px. | 1) Mover HyperFrames a la página dedicada **"Acerca del Sistema / Presentación"** (`/acerca`). 2) Actualizar los nombres de usuarios en BD para que provengan limpios de la sesión real sin sufijos `(DEMO)` artificiales. 3) Agrupar el Sidebar en 4 dominios (`Operación`, `Comercial`, `Análisis`, `Administración`), añadir selector de densidad (`Cómodo / Compacto`), Drawers laterales de detalle y Wizards guiados para Compra y Venta. | Inspección visual y prueba Playwright en resoluciones 1366px, 1440px, 1720px y móvil 375px. |

---

## 4. Qué se Preserva y Qué se Evoluciona

- **Se preserva al 100%**:
  - Los **51 lotes existentes** (45 `DISPONIBLES` con 1.260 sacos y 88.200 kg; 6 `VENDIDOS` con 195 sacos y 11.280 kg).
  - Las **10 compras** y **2 ventas históricas** con sus snapshots inmutables.
  - Los **6 proveedores**, **3 compradores**, **6 leyes del catálogo** y **4 cuentas de usuario** (con un rol adicional `LABORATORIO` habilitado).
  - La compatibilidad de guardar lotes directamente en estado `DISPONIBLE` por defecto, permitiendo opcionalmente flujo de validación de laboratorio.
- **Se evoluciona y amplía**:
  - Esquema Prisma PostgreSQL con migración incremental no destructiva (`20261116_mineralflow_v2_expansion`).
  - Sistema de diseño `"Geología de precisión + tecnología comercial"` (`#F7F4EE`, `#174A3C`, `#29755B`, `#B76543`, `#C49A44`, `#252B29`).
  - Escenas 3D interactivas (`Three.js` + `R3F` + `Drei`) con control de calidad y desconexión segura.
  - Módulos ampliados: Stepper de Recepción y Pesaje, Laboratorio y Ensayes, Almacén + Kardex + Vista 3D, Selección Masiva + Agrupador 3D, Wizard de Venta con Asistencia Documental M-02, y Grafo Interactivo de Trazabilidad.

