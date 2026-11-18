# MANUAL DE USUARIO — MINERALFLOW 2.0 (PLATAFORMA MINERA 3D)

## 1. Acceso y Perfiles Operativos

1. Ingrese a `http://localhost:5173`.
2. Seleccione cualquiera de los perfiles operativos o ingrese sus credenciales (Contraseña de demostración: `DemoMineral2026!`):
   - `admin` (**Administrador**): Control total de módulos, usuarios y bitácora de auditoría.
   - `almacenero` (**Almacenero**): Recepción guiada de compras, pesaje en balanza, almacén 3D y Kardex.
   - `vendedor` (**Vendedor**): Selección inteligente de lotes, Agrupador 3D y cierre atómico de ventas.
   - `laboratorio` (**Laboratorio**): Emisión y versionado de certificados de análisis químico.
   - `consulta` (**Consulta**): Acceso de solo lectura a toda la plataforma.

---

## 2. Controles Globales de Experiencia (Barra Superior)

- **Buscador Global**: Busque instantáneamente por código de lote (`LT-2026-0101`), boleto de pesaje, expediente M-02, cooperativa o mina.
- **Selector de Densidad (`Vista: Cómoda` / `Vista: Compacta`)**: Permite compactar el alto de las filas de tabla para trabajar con 40 o más lotes en pantalla sin desplazamiento excesivo.
- **Conmutador `3D Activo / 3D Off` y Selector de Calidad (`Automática`, `Alta`, `Baja`)**: Activa o desactiva en tiempo real todas las escenas 3D interactivas. Si desactiva el 3D en un equipo con recursos limitados, todas las funciones operativas continúan al 100% en Modo 2D.

---

## 3. Guía por Módulo

### 3.1. Dashboard General y Command Center 3D (Escena A)
- Interactúe con el volumen 3D central rotando con el ratón o haciendo clic en los marcadores de **Stock Disponible**, **Núcleo Total** o **Despachos Vendidos** para dirigirse al módulo correspondiente.
- Revise en la tarjeta principal tanto el **Peso Neto Húmedo** como el **Peso Seco estimado (ISO 10251)**.

### 3.2. Compras y Lotes — Asistente Stepper de 4 Pasos
1. Haga clic en **"Nueva Compra y Lotes"**.
2. **Paso 1 (Proveedor y Procedencia)**: Elija la cooperativa/proveedor, fecha, boleto de pesaje y guía de remisión.
3. **Paso 2 (Pesaje)**: Ingrese **Peso Bruto Húmedo**, **Tara** y **% de Humedad**. El sistema calcula automáticamente el **Peso Neto Húmedo** y el **Peso Neto Seco**.
4. **Paso 3 (Ensayes Químicos)**: Registre las leyes minerales (`Zn %`, `Ag g/t`, `Pb %`, `Sn %`) y su certificado.
5. **Paso 4 (Documentos M-02)**: Indique el código de expediente interno M-02 y confirme la compra.

### 3.3. Almacén Disponible — Escena B (Almacén 3D) y Kardex
- En la pestaña **Inventario 3D / 2D**, pase el cursor sobre cualquier bloque 3D para ver su lote, proveedor, sacos y peso, o haga clic para abrir su **Drawer lateral** y registrar un traslado interno de zona.
- En la pestaña **Kardex de Movimientos**, audite todas las entradas, cambios de ubicación y salidas por venta.

### 3.4. Selección y Venta — Escena C (Agrupador 3D) y Cierre Idempotente
- Seleccione lotes individualmente, por rango con **`Shift + Clic`** o con los botones rápidos **`10 lotes`**, **`20 lotes`** y **`40 lotes`**.
- Alterne si desea ponderar sobre **Peso Neto Húmedo** o **Peso Seco (ISO 10251)**.
- Observe en tiempo real la **Plataforma 3D de Consolidación**, las leyes promedio ponderadas, el **Contenido Fino (`kg finos` / `g finos`)** y el **Porcentaje de Cobertura (`100%`)**.
- Pulse **"Continuar con la Venta"**, elija el comprador, verifique el expediente M-02 y confirme la operación atómica.

### 3.5. Laboratorio y Ensayes (`/laboratorio`)
- Consulte todos los análisis químicos por lote y certificado.
- Pulse el icono de historial para revisar todas las versiones previas (`v1`, `v2`) o el icono de edición (en lotes disponibles) para emitir una nueva versión auditada.

### 3.6. Trazabilidad y M-02 (`/trazabilidad` — Escena D)
- Elija cualquier lote para visualizar los **6 eslabones de trazabilidad** desde la mina de origen hasta la liquidación de venta, así como el estado de los respaldos internos **SENARECOM M-02 y NIM/NIAR**.

### 3.7. Acerca del Sistema y Presentación HyperFrames (`/acerca` — Escena E)
- Desde el grupo **Administración → Acerca del Sistema**, pulse **"Reproducir Presentación Audiovisual HyperFrames"** para visualizar la pieza audiovisual de 5 escenas sin distraer la operación diaria.

