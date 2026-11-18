# PLAN DE EJECUCIÓN POR FASES Y DEPENDENCIAS — MINERALFLOW 2.0

## Resumen del Plan Técnico

El rediseño y ampliación operativa de **MineralFlow 2.0** se estructura en 9 fases secuenciales sin pérdida de datos sobre el proyecto existente:

| Fase | Nombre de la Fase | Dependencias | Entregables Clave |
|---|---|---|---|
| **Fase 0** | Inventario, Respaldo y Auditoría Inicial | Ninguna | `backups/mineralflow_pre_v2_backup.sql`, `docs/AUDITORIA_INICIAL.md`, `docs/PLAN_EJECUCION.md` |
| **Fase 1** | Sistema de Diseño 2.0 ("Geología de Precisión + Tecnología Comercial") | Fase 0 | `docs/DESIGN_SYSTEM.md`, tokens CSS en `frontend/src/index.css`, selector de densidad `Cómodo / Compacto`, nueva arquitectura de `AppLayout.tsx` con Sidebar agrupado (`Operación`, `Comercial`, `Análisis`, `Administración`) y Topbar con alertas reales y preferencias 3D |
| **Fase 2** | Migración Segura de Base de Datos y Motor Matemático 2.0 | Fase 0 | Migración Prisma no destructiva (`schema.prisma`), preservación verificada de los 51 lotes (45 disponibles, 6 vendidos), motor `calculations.ts` con Peso Bruto, Tara, Humedad, Peso Seco, Contenido Fino (`kg`/`g`), cobertura explícita e idempotencia en ventas |
| **Fase 3** | Escenas 3D Interactivas (`Three.js` + `@react-three/fiber` + `@react-three/drei`) | Fase 1, 2 | **Escena A**: Command Center 3D en Dashboard; **Escena B**: Almacén Virtual 3D (Visualización conceptual etiquetada con hit-testing y detalle); **Escena C**: Agrupador 3D de Venta sincronizado con selección; **Escena D**: Grafo Interactivo de Trazabilidad; controles de calidad (`Automática/Baja/Alta`, `3D Activado/Desactivado`) y ErrorBoundary WebGL |
| **Fase 4** | Rediseño de Módulos Core (Dashboard, Compras Stepper, Almacén + Kardex, Selección + Wizard de Venta, Historial y Directorios) | Fase 2, 3 | Vistas renovadas con Drawers laterales de detalle, Stepper de recepción/pesaje/documentos, Wizard de venta, columnas configurables, chips de filtro y separación Proveedor / Mina de Procedencia |
| **Fase 5** | Nuevos Módulos Especializados (Laboratorio Mineralógico, Trazabilidad y Asistencia Documental SENARECOM M-02) | Fase 2, 4 | Pantalla de Laboratorio y Versionado de Ensayes (`/laboratorio`), Pantalla de Trazabilidad e Integridad Documental M-02/NIM/NIAR (`/trazabilidad`), Kardex de movimientos de almacén |
| **Fase 6** | Motion UI y Composición Audiovisual HyperFrames 2.0 | Fase 1, 4 | Composición editable `hyperframes/index.html` y `hyperframes/SPEC.md` actualizada con las 6 etapas del storyboard y reubicada en la vista dedicada `/acerca` ("Acerca del Sistema y Presentación") |
| **Fase 7** | Suite de Pruebas Unitarias, Integración, Concurrencia, Idempotencia y E2E Playwright | Fase 2–6 | Suite `backend/src/system.test.ts` (12 pruebas específicas) + Suite E2E Playwright `frontend/e2e/mineralflow.spec.ts` en resoluciones desktop (`1366px`, `1440px`, `1720px`) y móvil (`375px`) |
| **Fase 8** | Documentación Técnica y Operativa Completa | Fase 7 | `docs/DESIGN_SYSTEM.md`, `docs/MODELO_DATOS.md`, `docs/CALCULOS_MINERALES.md`, `docs/REGLAS_NEGOCIO.md`, `docs/SEGURIDAD.md`, `docs/PRUEBAS_EVIDENCIAS.md`, `docs/MANUAL_USUARIO.md`, `docs/RESULTADO_FINAL.md` |

