# REPORTE DE PRUEBAS FUNCIONALES, CONCURRENCIA, SEGURIDAD Y E2E — MineralFlow

Todas las pruebas obligatorias especificadas en la Sección 10 del Prompt Maestro fueron implementadas y ejecutadas contra la base de datos real **PostgreSQL 18** (`localhost:5433/mineralflow`), el servidor **Fastify** (`localhost:3001`) y el navegador real **Google Chrome** mediante **Playwright**.

---

## 1. Comandos para Ejecutar las Pruebas

### Pruebas Unitarias, de Integración, Concurrencia, Seguridad y Rendimiento (Vitest)
```powershell
cd backend
npm test
```

### Pruebas End-to-End de Interfaz en Navegador Real (Playwright)
```powershell
cd frontend
npx playwright test
```

---

## 2. Matriz de Resultados de las 11 Pruebas Obligatorias

| N.º | Prueba Obligatoria | Método / Archivo de Verificación | Resultado Empírico | Estado |
|---|---|---|---|---|
| **Prueba 1** | **Registro de 40 lotes** con distintos proveedores, cantidades, pesos y leyes; verificar estado `DISPONIBLE` | `backend/src/system.test.ts` (`POST /api/compras` × 4 compras de 10 lotes) | Se crearon 40 lotes (`LT-TEST40-001` a `040`) con distintos proveedores; los 40 quedaron automáticamente en estado `DISPONIBLE`. | **APROBADO** |
| **Prueba 2** | **Selección masiva de 40 lotes** usando casillas, seleccionar todos, `Shift + Clic`, filtros y `VER SOLO SELECCIONADOS` | `frontend/e2e/mineralflow.spec.ts` (Playwright en Chrome real) | `Shift + Clic` entre `LT-2026-0101` y `LT-2026-0105` seleccionó exactamente 5 lotes; botón rápido de 40 lotes y vista `VER SOLO SELECCIONADOS` conservaron exactamente los 40 lotes. | **APROBADO** |
| **Prueba 3** | **Cálculos en tiempo real**: suma de sacos, suma de pesos, promedio ponderado exacto (`1000kg@40% + 2000kg@50% = 46,67%`), conversión `KG`/`TM`, leyes faltantes y pesos inválidos | `backend/src/system.test.ts` (`calcularResumenLotes`) | Resultado exacto `46.67%` (`46.6667%`); conversión `2.0 TM = 2000 KG`; leyes faltantes no se asumen como 0 y generan advertencia; pesos $\le 0$ son rechazados. | **APROBADO** |
| **Prueba 4** | **Venta de 40 lotes** a un comprador: única venta, 40 lotes cambian a `VENDIDO`, desaparecen del almacén disponible y quedan en historial | `backend/src/system.test.ts` + `frontend/e2e/mineralflow.spec.ts` | Se creó una única venta con exactamente 40 detalles; los 40 lotes cambiaron a `VENDIDO` y la consulta de disponibles para esos lotes devolvió `0`. | **APROBADO** |
| **Prueba 5** | **Doble venta**: intentar vender otra vez uno de los mismos lotes vendidos | `backend/src/system.test.ts` (`POST /api/ventas` con lote ya vendido) | El backend bloqueó la operación con código `HTTP 409 Conflicto de disponibilidad de lotes` y revirtió la transacción. | **APROBADO** |
| **Prueba 6** | **Concurrencia**: dos usuarios intentando vender simultáneamente un mismo lote | `backend/src/system.test.ts` (`Promise.all` simultáneo entre Vendedor y Admin) | Exactamente una solicitud devolvió `201 Created` y la segunda devolvió `409 Conflict` gracias al aislamiento `Serializable` y actualización condicional atómica. | **APROBADO** |
| **Prueba 7** | **Historial**: abrir la venta registrada y verificar comprador, proveedores originales, fechas, sacos, pesos, leyes y promedios | `backend/src/system.test.ts` + `frontend/e2e/mineralflow.spec.ts` | El expediente de la venta muestra el snapshot inmutable de los 40 lotes, proveedores originales, sacos, pesos y leyes promedio ponderadas. | **APROBADO** |
| **Prueba 8** | **Persistencia**: reiniciar el servidor y comprobar que compras, lotes y ventas continúan guardados | Reinicio real del proceso Fastify y consulta a PostgreSQL 18 | Tras detener e iniciar nuevamente el servidor, los 51 lotes (5 disponibles y 46 vendidos tras el test E2E) permanecieron intactos en PostgreSQL. | **APROBADO** |
| **Prueba 9** | **Rendimiento**: probar con 1.000 lotes y verificar velocidad de cálculo y respuesta | `backend/src/system.test.ts` (benchmark sobre 1.000 lotes con múltiples leyes y unidades mixtas) | El cálculo completo de suma de sacos, conversión de toneladas y leyes promedio ponderadas de 1.000 lotes se ejecutó en `< 50 ms` (umbral `< 150 ms`). | **APROBADO** |
| **Prueba 10** | **Seguridad (RBAC)**: comprobar que usuarios sin permisos no puedan modificar lotes, registrar ventas ni acceder a operaciones administrativas | `backend/src/system.test.ts` (pruebas con tokens de `CONSULTA`, `ALMACENERO` y `VENDEDOR`) | El backend rechazó con `HTTP 403 Forbidden` todo intento no autorizado según la matriz de roles. | **APROBADO** |
| **Prueba 11** | **Interfaz (Playwright)**: verificar botones, formularios, navegación, ausencia de errores de consola y diseño responsive móvil (`375px`) | `frontend/e2e/mineralflow.spec.ts` | Flujo completo E2E aprobado en `3.5s` con `0` errores de consola y adaptación responsive verificada en `1440×900` y `375×812`. | **APROBADO** |

