# PRUEBAS Y EVIDENCIAS EMPÍRICAS — MINERALFLOW 2.0

Todas las pruebas unitarias, de integración, concurrencia, idempotencia y E2E en navegador real fueron ejecutadas y verificadas contra **PostgreSQL 18.6** (`localhost:5433/mineralflow`), **Fastify** (`localhost:3001`) y **Google Chrome** (`Playwright`).

---

## 1. Matriz de las 12 Pruebas Específicas Requeridas (Sección 9 del Prompt Maestro)

| N.º | Prueba Específica Requerida | Archivo / Comando Ejecutado | Resultado Verificado | Estado |
|---|---|---|---|---|
| **1** | **Preservar conteos antes/después de migración** (51 lotes, 45 disponibles, 6 vendidos, 1.260 sacos disponibles, 88.200 kg disponibles y 11.280 kg vendidos) | `backend/src/system.test.ts` (`Prueba 1`) + consulta `psql` directa | Conteos idénticos antes y después de la migración `20261116014800_mineralflow_v2_expansion`: **51 lotes totales, 45 disponibles (1.260 sacos, 88.200 kg) y 6 vendidos (195 sacos, 11.280 kg)**. | **APROBADO** |
| **2** | **Crear 40 lotes en entorno de pruebas aislado; seleccionar con casillas, Shift+Clic, filtros y "solo seleccionados"** | `backend/src/system.test.ts` + `frontend/e2e/mineralflow.spec.ts` | `Shift + Clic` entre `LT-2026-0101` y `LT-2026-0105` seleccionó 5 lotes; botón `40 lotes` y `VER SOLO SELECCIONADOS` agruparon exactamente 40 lotes. | **APROBADO** |
| **3** | **Ensayar promedios porcentuales: 1.000 kg a 40% + 2.000 kg a 50% = 46,666…%** | `backend/src/system.test.ts` (`Prueba 3`) | `leyPromedio = 46.6667%`, `leyPromedioRedondeada = 46.67%`, `contenidoFino = 1400.0000 kg finos`. | **APROBADO** |
| **4** | **Ensayar ley Ag: 1 t a 200 g/t + 2 t a 300 g/t = 266,666… g/t** | `backend/src/system.test.ts` (`Prueba 4`) | Conversión `1 TM = 1.000 kg` y `2 TM = 2.000 kg`; `leyPromedio = 266.6667 g/t` (`266.67 g/t`), `contenidoFino = 800.0000 g finos`. | **APROBADO** |
| **5** | **Comprobar que una ley faltante NO es cero y que el resumen no implica cobertura total** | `backend/src/system.test.ts` (`Prueba 5`) | Lote con `NO_MEDIDO` se excluye del denominador; el promedio se mantiene en `12.00%` con `coberturaPct = 50.00%` (`1/2 lotes`) y advertencia explícita. | **APROBADO** |
| **6** | **Comprobar fórmula peso bruto − tara; peso seco según humedad y método ISO 10251** | `backend/src/system.test.ts` (`Prueba 6`) | `1545.50 - 45.50 = 1500.00 kg húmedos`; con `5.00%` de humedad da exactamente `1425.00 kg secos`. | **APROBADO** |
| **7** | **Registrar una venta con 40 lotes, actualizar stock y crear historia reproducible** | `backend/src/system.test.ts` (`Prueba 7`) + `frontend/e2e/mineralflow.spec.ts` | Venta creada con 40 detalles inmutables, salida en Kardex y bloqueo `HTTP 409` ante intento de editar ensayes de lotes vendidos. | **APROBADO** |
| **8** | **Ejecutar dos ventas concurrentes de un mismo lote y doble solicitud con la misma `idempotencyKey`** | `backend/src/system.test.ts` (`Prueba 8`) | Dos ventas simultáneas devolvieron `[201, 409]`; repetir la misma `idempotencyKey` devolvió `200 OK (idempotente: true)` con la misma venta sin duplicar. | **APROBADO** |
| **9** | **Validar rollback de error transaccional, login/roles y accesibilidad** | `backend/src/system.test.ts` (`Prueba 9`) | Grupo mixto (`1 disponible + 1 vendido`) hizo `ROLLBACK` total manteniendo el lote disponible intacto; verificados roles `ADMINISTRADOR`, `ALMACENERO`, `VENDEDOR`, `LABORATORIO` y `CONSULTA`. | **APROBADO** |
| **10** | **Probar dispositivos de bajo rendimiento / escenas 3D desactivadas y fallback 2D** | `frontend/e2e/mineralflow.spec.ts` (`btn-toggle-3d`) | Al desactivar 3D, el Agrupador cambia instantáneamente a `Bandeja de Consolidación (Modo 2D)` y completa el cierre de venta de 40 lotes sin interrupción. | **APROBADO** |
| **11** | **Reiniciar servicios y verificar persistencia** | Reinicio de Fastify y consulta a PostgreSQL 18 | Los datos persisten íntegramente en disco (`.pgdata` en puerto `5433`). | **APROBADO** |
| **12** | **Inspeccionar cada pantalla visualmente en desktop (`1720px`, `1440px`, `1366px`) y móvil (`375px`)** | `frontend/e2e/mineralflow.spec.ts` + capturas en `docs/` | `0` errores de consola o página; capturas verificadas visualmente. | **APROBADO** |

---

## 2. Evidencia Visual Capturada en Navegador Real (Playwright + Chrome)

Las capturas de alta resolución generadas durante la ejecución real se encuentran almacenadas en la carpeta `docs/`:
1. [evidence_01_dashboard_3d.png](file:///c:/Users/llano/Downloads/sistema%20de%20minerales/docs/evidence_01_dashboard_3d.png) — Dashboard Ejecutivo 2.0 con **Escena A (Command Center 3D)**, KPIs húmedo/seco y alertas M-02.
2. [evidence_02_almacen_3d.png](file:///c:/Users/llano/Downloads/sistema%20de%20minerales/docs/evidence_02_almacen_3d.png) — Almacén de Minerales con **Escena B (Almacén Virtual 3D Conceptual)**, selector de calidad y columnas configurables.
3. [evidence_03_laboratorio.png](file:///c:/Users/llano/Downloads/sistema%20de%20minerales/docs/evidence_03_laboratorio.png) — Módulo de **Laboratorio y Análisis Mineralógico** con certificados y control de versiones (`v1`, `v2`).
4. [evidence_04_trazabilidad_m02.png](file:///c:/Users/llano/Downloads/sistema%20de%20minerales/docs/evidence_04_trazabilidad_m02.png) — **Escena D (Grafo Interactivo de Trazabilidad de 6 Eslabones)** y control documental interno **SENARECOM M-02 / NIM / NIAR**.
5. [evidence_05_seleccion_3d_40lotes.png](file:///c:/Users/llano/Downloads/sistema%20de%20minerales/docs/evidence_05_seleccion_3d_40lotes.png) — **Escena C (Plataforma 3D de Consolidación de Venta)** con 40 lotes seleccionados, contenido fino (`kg`/`g`), cobertura `100%` y barra flotante inferior.
6. [evidence_06_expediente_venta.png](file:///c:/Users/llano/Downloads/sistema%20de%20minerales/docs/evidence_06_expediente_venta.png) — Expediente histórico inmutable de la venta de 40 lotes con exportación a PDF, CSV/Excel e impresión.

