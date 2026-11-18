# ARQUITECTURA DEL SISTEMA — MineralFlow

## 1. Visión Arquitectónica General

**MineralFlow** implementa una arquitectura cliente-servidor desacoplada en capas con persistencia relacional ACID en **PostgreSQL 18**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SPA React 19 + TS)                     │
│  Vite 6 · Tailwind CSS 4 · Motion for React · Recharts · Decimal.js     │
│  Módulos: Dashboard | Compras | Almacén | Selección | Ventas | Catálogos│
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ REST API JSON (JWT + Cookie HttpOnly)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js + Fastify 5)                    │
│  Validación Zod · Middleware RBAC · Motor Decimal.js · Transacciones    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ Prisma ORM 6 (Aislamiento Serializable)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   BASE DE DATOS RELACIONAL (PostgreSQL 18)              │
│  Campos NUMERIC(14,4) · Restricción UNIQUE(lote_id) en detalle_ventas   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Justificación de Tecnologías Seleccionadas

### Backend: Fastify 5 con TypeScript
Se eligió **Fastify** frente a NestJS por las siguientes razones técnicas:
1. **Latencia mínima y alto throughput** en operaciones de filtrado y cálculo sobre cientos o miles de lotes.
2. **Integración directa y limpia con Zod y Prisma ORM**, evitando sobrecarga de decoradores o metadatos de reflexión en tiempo de ejecución.
3. **Ciclo de pruebas de integración ultrarrápido** mediante `app.inject()` en Vitest sin necesidad de levantar sockets TCP adicionales por cada test.

### Precisión Matemática: `Decimal.js` + `NUMERIC(14,4)`
Tanto el frontend como el backend comparten la misma lógica determinística basada en `Decimal.js`, y PostgreSQL almacena todos los pesos y leyes en columnas `DECIMAL(14,4)`, eliminando cualquier error de coma flotante binaria (`IEEE 754`).

---

## 3. Estructura de Directorios del Proyecto

```text
sistema de minerales/
├── backend/
│   ├── prisma/
│   │   ├── migrations/              # Migraciones SQL versionadas
│   │   ├── schema.prisma            # Modelo relacional PostgreSQL
│   │   └── seed.ts                  # Semilla de datos ficticios (45 disponibles + 6 vendidos)
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts              # Autenticación JWT y autorización RBAC por rol
│   │   ├── routes/
│   │   │   ├── auth.ts              # Login, sesión y gestión de usuarios
│   │   │   ├── catalogs.ts          # Proveedores, compradores y catálogo de leyes
│   │   │   ├── comprasLotes.ts      # Registro de compras multilote y almacén
│   │   │   ├── ventas.ts            # Cierre atómico de ventas e historial
│   │   │   └── dashboard.ts         # KPIs y series temporales en vivo
│   │   ├── utils/
│   │   │   └── calculations.ts      # Motor de cálculo ponderado Decimal.js
│   │   ├── db.ts                    # Cliente Prisma y servicio de auditoría
│   │   ├── server.ts                # Servidor Fastify principal
│   │   └── system.test.ts           # Suite automatizada Vitest (Pruebas 1 a 10)
├── frontend/
│   ├── e2e/
│   │   └── mineralflow.spec.ts      # Prueba E2E en navegador real con Playwright (Prueba 11)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.tsx        # Sidebar, Topbar y navegación responsive
│   │   │   ├── HyperFramesModal.tsx # Reproductor interactivo de las 5 escenas
│   │   │   └── MineralGraphics.tsx  # Ilustraciones y diagramas SVG originales
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Estado global de sesión y permisos
│   │   ├── pages/                   # Pantallas de los 8 módulos funcionales + Auditoría
│   │   └── utils/
│   │       ├── api.ts               # Cliente HTTP tipado
│   │       └── calculations.ts      # Motor de cálculo en tiempo real + formatos es-BO
├── hyperframes/
│   ├── SPEC.md                      # Especificación técnica de dirección HyperFrames
│   └── index.html                   # Composición audiovisual HTML/GSAP de 5 escenas
└── scripts/
    ├── iniciar-base-datos.ps1       # Inicialización y migración de PostgreSQL 18
    └── iniciar-sistema.ps1          # Arranque integral en Windows 11
```

