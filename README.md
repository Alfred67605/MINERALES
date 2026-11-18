# MINERALES — MineralFlow (Bolivia)
### Plataforma Integral de Gestión de Compras, Almacén, Laboratorio y Ventas de Lotes Mineros

Sistema web comercial de alta precisión para comercializadoras y empresas mineras en Bolivia. Permite el control riguroso de compras de lotes mineros, pesaje (bruto, tara, neto y seco ISO 10251), gestión detallada de almacén por zonas y sacos (`kg/saco`), agrupación masiva de lotes con selección por rango (`Shift + Clic`), cálculo de leyes promedio ponderadas y valorización en Bolivianos (`Bs` y `Bs/saco`) en tiempo real, reportes estadísticos en PDF/Excel, copias de seguridad avanzadas, administración de perfiles y bitácora inmutable de auditoría.

---

## 🛠️ Tecnologías del Sistema

- **Frontend:**
  - React 19 + TypeScript + Vite
  - Tailwind CSS v4 (con soporte dual Modo Oscuro Azul Cian Tecnológico y Modo Claro)
  - Motion for React (microinteracciones y transiciones fluidas)
  - Recharts (gráficos analíticos de compras, ventas, stock y estadísticas por mineral/proveedor)
  - jsPDF & jsPDF-AutoTable (reportes PDF corporativos con liquidación en Bs/$US y detalle por saco)
  - Lucide Icons (iconografía semántica por mineral y proceso)

- **Backend:**
  - Node.js + TypeScript
  - Fastify (API REST de alto rendimiento y baja latencia)
  - Prisma ORM 6 (modelado relacional estricto, migraciones y tipos)
  - Decimal.js (cálculos matemáticos de leyes y pesos de precisión arbitraria)
  - Autenticación con JWT + contraseñas hasheadas con bcryptjs (RBAC de 5 roles)

- **Base de Datos:**
  - PostgreSQL 16+ (transacciones ACID con aislamiento Serializable para evitar doble venta)

- **Calidad y Pruebas:**
  - Vitest (10 pruebas unitarias y de integración de backend)
  - Playwright (suite E2E completa en Google Chrome real)

---

## 📋 Requisitos Previos para Instalar en Otra PC

Antes de comenzar, asegúrate de tener instalado en la máquina:
1. **Node.js**: versión 20.x, 22.x o 24.x ([Descargar Node.js](https://nodejs.org/))
2. **Git**: ([Descargar Git](https://git-scm.com/))
3. **PostgreSQL**: versión 15, 16 o superior ([Descargar PostgreSQL](https://www.postgresql.org/download/)) **O** Docker con Docker Compose.

---

## 🚀 Guía de Instalación Paso a Paso en Otra PC

### Paso 1: Clonar el Repositorio

Abre una terminal (PowerShell, CMD, Git Bash o terminal de Linux/Mac) y clona el proyecto:

```bash
git clone https://github.com/Alfred67605/MINERALES.git
cd MINERALES
```

---

### Paso 2: Configurar la Base de Datos PostgreSQL

Tienes dos alternativas sencillas para la base de datos:

#### Opción A: Con tu PostgreSQL Local ya instalado (Recomendada)
1. Abre tu gestor de base de datos (`pgAdmin`, `psql` o `DBeaver`).
2. Crea una base de datos vacía llamada `mineralflow`:
   ```sql
   CREATE DATABASE mineralflow;
   ```
3. Verifica tu usuario, contraseña y puerto de PostgreSQL (por defecto suele ser puerto `5432` y usuario `postgres`).

#### Opción B: Con Docker (opcional si tienes Docker Desktop)
```bash
docker run --name mineralflow-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mineralflow -p 5432:5432 -d postgres:16-alpine
```

---

### Paso 3: Configurar e Iniciar el Backend

1. Entra a la carpeta `backend`:
   ```bash
   cd backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Crea el archivo de variables de entorno `.env`:
   - Copia `.env.example` como `.env`:
     ```bash
     # En Windows (PowerShell):
     Copy-Item .env.example .env

     # En Linux / Mac / Git Bash:
     cp .env.example .env
     ```
   - Abre `backend/.env` y ajusta tu conexión a PostgreSQL si tu usuario o puerto es diferente. Ejemplo:
     ```env
     DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/mineralflow?schema=public"
     JWT_SECRET="mineralflow-super-secret-jwt-key-bolivia-2026"
     PORT=3001
     FRONTEND_URL="http://localhost:5173"
     ```

4. Aplica las migraciones de base de datos con Prisma:
   ```bash
   npx prisma migrate deploy
   ```

5. Carga los datos iniciales y lotes de demostración:
   ```bash
   npm run db:seed
   ```
   *(Esto creará usuarios, catálogos de minerales, cotizaciones de la quincena de noviembre 2026 y 45 lotes disponibles listos para operar).*

6. Inicia el servidor backend:
   ```bash
   npm start
   ```
   Verás en consola:
   ```
   🚀 MineralFlow API ejecutándose en http://localhost:3001
   ```

---

### Paso 4: Configurar e Iniciar el Frontend

Abre **otra pestaña o ventana de terminal** en la raíz del proyecto:

1. Entra a la carpeta `frontend`:
   ```bash
   cd frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   Verás en consola:
   ```
     VITE ready in ... ms
     ➜  Local:   http://localhost:5173/
   ```

4. Abre tu navegador web y entra a:
   👉 **http://localhost:5173**

---

## 🔑 Credenciales de Acceso al Sistema

El formulario de inicio de sesión ya viene precargado con el usuario administrador. Todas las cuentas de prueba tienen la contraseña: **`DemoMineral2026!`**

| Usuario | Contraseña | Rol | Permisos y Alcance |
|---|---|---|---|
| **admin** | `DemoMineral2026!` | `ADMINISTRADOR` | Acceso total al sistema, catálogos, compras, almacén, ventas, auditoría y usuarios |
| **almacenero** | `DemoMineral2026!` | `ALMACENERO` | Registro de compras, recepción de camiones, pesaje y control de almacén |
| **vendedor** | `DemoMineral2026!` | `VENDEDOR` | Selección de lotes, cálculo de leyes promedio y cierre de ventas |
| **laboratorio** | `DemoMineral2026!` | `LABORATORIO` | Emisión y edición de certificados químicos y versionado de ensayes |
| **consulta** | `DemoMineral2026!` | `CONSULTA` | Visualización en modo solo lectura de reportes y stocks |

---

## 📊 Reportes, Estadísticas y Valorización en Bolivianos (Bs)

- En **Inicio / Resumen**, **Mi Almacén**, **Vender Lotes** y **Ventas Realizadas** el sistema calcula automáticamente el valor estimado neto en **Bolivianos (`Bs`)** y **Dólares (`$US`)** aplicando las cotizaciones oficiales SENARECOM (o precios en vivo/manuales), el **Tipo de Cambio del Dólar Paralelo (`11,92 Bs`) o Valor Referencial BCB (`11,70 Bs`)** configurable en tiempo real (con opción oficial nominal y manual), descontando la Regalía Minera (Ley 535) y detallando el **peso promedio por saco (`kg/saco`)** y el **valor por saco (`Bs/saco`)**.
- En el módulo **Reportes y Estadísticas** (`/reportes`) puedes filtrar por fecha, mineral, proveedor o estado del lote, analizar estadísticas detalladas con gráficos por mineral, proveedor, ventas y lotes/sacos, y exportar todo a **PDF** corporativo o **Excel/CSV**.

---

## 💾 Copias de Seguridad (Backups) y Perfiles Avanzados

- En **Administración → Respaldo de Datos** (solo administrador) puedes generar copias completas de la base de datos al instante, configurar la **programación de respaldos automáticos** (mensual, quincenal, semanal o diario con hora personalizada y cálculo de próxima ejecución), descargar archivos, subir copias desde otra PC y restaurar la base de datos con respaldo automático preventivo. Los archivos se guardan en `backups/respaldos/`.
- En **Administración → Usuarios y Permisos** puedes consultar las tarjetas y matriz de permisos de los **5 perfiles** (`ADMINISTRADOR`, `ALMACENERO`, `VENDEDOR`, `LABORATORIO`, `CONSULTA`), crear cuentas, editar perfiles/contraseñas, activar/desactivar usuarios y exportar el registro de auditoría en PDF.

---

## 🧪 Ejecución de Pruebas Automatizadas

El proyecto incluye suites completas de verificación:

### 1. Pruebas de Backend (Vitest)
Verifica transacciones atómicas, prevención de doble venta, idempotencia y cálculos de leyes ponderadas con `Decimal.js`:
```bash
cd backend
npm test
```

### 2. Pruebas End-to-End (Playwright)
Ejecuta la automatización en un navegador Google Chrome real verificando login, dashboard, almacén por zonas, laboratorio, trazabilidad, copias de seguridad, perfiles, reportes y estadísticas, venta de 40 lotes con cálculo en `Bs` y `Bs/saco`, cotizaciones y responsive:
```bash
cd frontend
npx playwright test
```

### 3. Compilación de Producción del Frontend
```bash
cd frontend
npm run build
```

---

## 📦 Estructura del Proyecto

```
MINERALES/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Modelo relacional completo (Lotes, Leyes, Ventas, M-02)
│   │   ├── migrations/          # Historial de migraciones SQL versionadas
│   │   └── seed.ts              # Población de 45 lotes reales, cotizaciones y usuarios
│   ├── src/
│   │   ├── routes/              # Endpoints Fastify (lotes, compras, ventas, cotizaciones)
│   │   ├── middleware/          # Seguridad RBAC y validación JWT
│   │   ├── utils/               # Motor de cálculo matemático con Decimal.js
│   │   ├── db.ts                # Conexión Prisma Client
│   │   └── server.ts            # Servidor principal Fastify
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes UI (AppLayout, 3D Canvas, Gráficos)
│   │   ├── pages/               # Vistas (Dashboard, Compras, Almacén, Venta, Precios)
│   │   ├── context/             # Estados globales (Auth, Preferencias UI, Tema)
│   │   └── utils/               # Funciones de cálculo y formateo boliviano
│   ├── e2e/                     # Pruebas End-to-End con Playwright
│   ├── index.html
│   └── package.json
│
├── hyperframes/                 # Composición audiovisual de presentación en 5 escenas
├── scripts/                     # Scripts de automatización y mantenimiento
├── docs/                        # Capturas de evidencia y manuales
├── .gitignore                   # Exclusión de node_modules, .pgdata y .env
└── README.md                    # Esta guía
```

---

## 🇧🇴 Cumplimiento Normativo Minero (Bolivia)
- **Cotizaciones Oficiales SENARECOM:** Tabla quincenal con precios de minerales tradicionales, marginales y complejos (Zinc, Estaño, Oro, Plata, Plomo, Antimonio, Wolfram, Cobre, Bismuto).
- **Regalía Minera Ley 535:** Descuentos porcentuales normativos automáticos por tipo de mineral y presentación.
- **Tipo de Cambio Oficial BCB:** 6.96 Bs / $US.
- **Formularios de Transporte y Venta:** Trazabilidad documental de los formularios internos **M-02** (Transporte de Minerales) y **M-03** (Comercialización interna y exportación).
