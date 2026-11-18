# MODELO DE DATOS Y MIGRACIÓN INCREMENTAL — MINERALFLOW 2.0

## 1. Estrategia de Evolución sin Pérdida de Datos

El modelo de base de datos en **PostgreSQL 18.6** fue evolucionado desde la versión `v1.0` a `v2.0` mediante la migración incremental versionada:
- `backend/prisma/migrations/20261116014800_mineralflow_v2_expansion/migration.sql`

### Respaldo y Rollback Verificado
- **Respaldo previo completo (`pg_dump`)**: `backups/mineralflow_pre_v2_backup.sql`
- **Verificación de conteos antes y después de la migración**:
  - Lotes `DISPONIBLE`: **45 lotes** (**1.260 sacos** · **88.200,0000 kg**)
  - Lotes `VENDIDO`: **6 lotes** (**195 sacos** · **11.280,0000 kg**)
  - Total global intacto: **51 lotes** (**1.455 sacos** · **99.480,0000 kg**)

---

## 2. Entidades Ampliadas y Nuevas Tablas en v2.0

### 2.1. Separación de Proveedor Comercial y Mina de Procedencia
- **`proveedores`**: Añade `nim_niar`, `municipio`, `departamento`.
- **`minas` (Nueva tabla)**: `id`, `codigo (UNIQUE)`, `nombre`, `localidad`, `departamento`, `proveedor_id (FK)`, `estado`. Permite relación `1:N` entre una cooperativa/proveedor y múltiples yacimientos o bocaminas.

### 2.2. Recepción, Boletos de Pesaje y Descuento de Humedad (ISO 10251)
- **`compras`**: Añade `boleto_pesaje`, `guia_remision`, `expediente_m02`, `estado_m02` (`PENDIENTE` | `RECIBIDO` | `VERIFICADO`), `nim_operador`.
- **`lotes`**:
  - Conserva `peso_neto` (`DECIMAL(14,4)`) y `estado` (`DISPONIBLE` por defecto).
  - Añade `peso_bruto_humedo` (`DECIMAL(14,4)`), `peso_tara` (`DECIMAL(14,4)`), `humedad_pct` (`DECIMAL(6,2)`), `peso_seco` (`DECIMAL(14,4)`), `boleto_pesaje`, `metodo_humedad` (`ISO 10251`), `metodo_muestreo` (`ISO 12743`), `mina_id` y `ubicacion_id`.

### 2.3. Laboratorio Mineralógico y Versionado de Ensayes
- **`lote_leyes`**: Añade `tipo_ensaye` (`PROVISIONAL` | `FINAL` | `LABORATORIO_EXTERNO` | `DIRIMENCIA`), `estado_medicion` (`MEDIDO` | `SIN_DATO` | `NO_MEDIDO` | `BAJO_LIMITE_DETECCION` | `CERO_MEDIDO` | `VALIDADO`), `laboratorio`, `nro_certificado`, `metodo_analisis`, `version_actual`, `validado_por`, `fecha_ensaye`.
- **`ensaye_versiones` (Nueva tabla)**: Conserva el historial inmutable de cada versión emitida para un análisis químico (`version`, `valor`, `tipo_ensaye`, `estado_medicion`, `laboratorio`, `nro_certificado`, `motivo_cambio`, `usuario_nombre`, `created_at`).

### 2.4. Ubicaciones de Almacén y Kardex Físico Inmutable
- **`ubicaciones_almacen` (Nueva tabla)**: `codigo (UNIQUE)`, `nombre`, `zona`, `capacidad_kg`, `es_conceptual`.
- **`movimientos_inventario` (Nueva tabla — Kardex)**: Registra cada `RECEPCION_COMPRA`, `CAMBIO_UBICACION`, `AJUSTE_AUDITADO` y `SALIDA_VENTA` con `sacos_antes`, `sacos_despues`, `peso_kg_antes`, `peso_kg_despues`, `motivo`, `usuario_nombre` y `fecha_hora`.

### 2.5. Ventas Atómicas, Idempotencia y Contenido Fino
- **`ventas`**: Añade `idempotency_key (UNIQUE)`, `peso_total_seco_kg`, `expediente_m02`, `estado_m02`, `expediente_m03`.
- **`detalle_ventas`**: Mantiene `lote_id UNIQUE` (imposibilidad física de doble venta) y añade `peso_seco_registrado` y `humedad_registrada_pct`.
- **`resumen_leyes_venta`**: Añade `contenido_fino` (`DECIMAL(14,4)`), `unidad_fino` (`kg finos`, `g finos`) y `cobertura_pct` (`DECIMAL(6,2)`).

### 2.6. Asistencia Documental Normativa y Auditoría
- **`documentos_cumplimiento` (Nueva tabla)**: Almacena metadatos de respaldos internos (`FORMULARIO_M02`, `FORMULARIO_M03`, `BOLETO_PESAJE`, `CERTIFICADO_LAB`, `NIM_NIAR`) asociados a una compra, lote o venta.
- **`auditoria`**: Añade `ip_origen` e `idempotency_key`.

