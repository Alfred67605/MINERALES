# MODELO DE BASE DE DATOS — MineralFlow (PostgreSQL 18)

## 1. Principios de Diseño Relacional

1. **Cero Flotantes Binarios (`FLOAT` / `REAL` / `DOUBLE PRECISION`)**: Todos los campos de peso y análisis de leyes minerales utilizan `DECIMAL(14, 4)` (`NUMERIC` exacto en PostgreSQL).
2. **Restricción Física contra Doble Venta**: La tabla `detalle_ventas` incluye una restricción `UNIQUE (lote_id)` a nivel de motor PostgreSQL, garantizando que ningún lote pueda asociarse a más de una venta válida incluso bajo concurrencia extrema.
3. **Inmutabilidad Histórica (Snapshots)**: Al confirmar una venta, `detalle_ventas` y `ventas` almacenan copias inmutables (`numero_lote_snapshot`, `proveedor_nombre_snapshot`, `peso_registrado`, `leyes_snapshot` en JSONB y `resumen_leyes_venta`), asegurando que cambios posteriores en catálogos nunca alteren las liquidaciones históricas.

---

## 2. Entidades y Relaciones Principales

### 2.1. `usuarios`
- `id` (UUID, PK)
- `nombre` (TEXT, NOT NULL)
- `email` (TEXT, UNIQUE, NOT NULL)
- `username` (TEXT, UNIQUE, NOT NULL)
- `hash_password` (TEXT, NOT NULL)
- `rol` (`ADMINISTRADOR` | `ALMACENERO` | `VENDEDOR` | `CONSULTA`)
- `estado` (`ACTIVO` | `INACTIVO`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2.2. `proveedores`
- `id` (UUID, PK)
- `codigo` (TEXT, UNIQUE, NOT NULL)
- `nombre` (TEXT, NOT NULL)
- `mina_origen` (TEXT, NULLABLE)
- `telefono` (TEXT, NULLABLE)
- `observaciones` (TEXT, NULLABLE)
- `estado` (`ACTIVO` | `INACTIVO`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2.3. `compradores`
- `id` (UUID, PK)
- `codigo` (TEXT, UNIQUE, NOT NULL)
- `nombre` (TEXT, NOT NULL)
- `identificacion` (TEXT, NULLABLE — NIT o identificación)
- `telefono`, `direccion`, `observaciones` (TEXT, NULLABLE)
- `estado` (`ACTIVO` | `INACTIVO`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 2.4. `catalogo_leyes`
Catálogo flexible de elementos y unidades de medición:
- `id` (UUID, PK)
- `codigo` (TEXT, UNIQUE — ej. `ZN_PCT`, `AG_DM`, `AG_GT`, `PB_PCT`, `SN_PCT`, `CU_PCT`)
- `mineral` (TEXT — ej. `Zinc`, `Plata`, `Estaño`, `Plomo`)
- `simbolo` (TEXT — ej. `Zn`, `Ag`, `Sn`, `Pb`)
- `nombre_ley` (TEXT)
- `unidad_medida` (TEXT — ej. `%`, `DM`, `g/t`)
- `valor_minimo`, `valor_maximo` (`DECIMAL(14,4)`)
- `decimales` (INTEGER)

### 2.5. `compras`
- `id` (UUID, PK)
- `numero_compra` (TEXT, UNIQUE)
- `fecha` (TIMESTAMPTZ)
- `proveedor_id` (UUID, FK → `proveedores.id`)
- `usuario_id` (UUID, FK → `usuarios.id`)
- `observaciones` (TEXT)
- `created_at`, `updated_at`

### 2.6. `lotes`
- `id` (UUID, PK)
- `numero_lote` (TEXT, UNIQUE, NOT NULL)
- `compra_id` (UUID, FK → `compras.id`)
- `proveedor_id` (UUID, FK → `proveedores.id`)
- `usuario_id` (UUID, FK → `usuarios.id`)
- `fecha_compra` (TIMESTAMPTZ)
- `mina_origen` (TEXT)
- `cantidad_sacos` (INTEGER, NOT NULL)
- `peso_neto` (`DECIMAL(14,4)`, NOT NULL)
- `peso_seco` (`DECIMAL(14,4)`, NULLABLE)
- `unidad_peso` (`KG` | `TM`)
- `tipo_mineral` (TEXT, NOT NULL)
- `estado` (`DISPONIBLE` | `VENDIDO`)
- `observaciones` (TEXT)
- Índices en: `(estado)`, `(fecha_compra)`, `(proveedor_id)`, `(tipo_mineral)`.

### 2.7. `lote_leyes`
Relación `1:N` entre cada lote y sus análisis químicos:
- `id` (UUID, PK)
- `lote_id` (UUID, FK → `lotes.id`)
- `catalogo_ley_id` (UUID, FK → `catalogo_leyes.id`)
- `valor` (`DECIMAL(14,4)`, NOT NULL)
- Restricción `UNIQUE (lote_id, catalogo_ley_id)`.

### 2.8. `ventas`
- `id` (UUID, PK)
- `numero_venta` (TEXT, UNIQUE, NOT NULL)
- `fecha` (TIMESTAMPTZ)
- `comprador_id` (UUID, FK → `compradores.id`)
- `usuario_id` (UUID, FK → `usuarios.id`)
- `total_lotes`, `total_sacos` (INTEGER)
- `peso_total_kg` (`DECIMAL(14,4)`)
- `criterio_peso` (TEXT)
- `comprador_nombre_snapshot`, `comprador_nit_snapshot` (TEXT)
- `estado` (`CONFIRMADA` | `ANULADA`)
- `observaciones` (TEXT)

### 2.9. `detalle_ventas`
- `id` (UUID, PK)
- `venta_id` (UUID, FK → `ventas.id`)
- `lote_id` (UUID, **UNIQUE**, FK → `lotes.id`)
- `numero_lote_snapshot`, `proveedor_nombre_snapshot`, `mina_origen_snapshot`, `tipo_mineral_snapshot`
- `sacos_registrados` (INTEGER)
- `peso_registrado`, `peso_kg_calculado` (`DECIMAL(14,4)`)
- `unidad_peso_registrada` (`KG` | `TM`)
- `leyes_snapshot` (JSONB)

### 2.10. `resumen_leyes_venta`
Almacena las leyes promedio ponderadas calculadas al confirmar la venta:
- `id` (UUID, PK)
- `venta_id` (UUID, FK → `ventas.id`)
- `codigo_ley`, `mineral`, `simbolo`, `nombre_ley`, `unidad_medida`
- `ley_promedio` (`DECIMAL(14,4)`)
- `peso_base_ponderado_kg` (`DECIMAL(14,4)`)
- `lotes_incluidos`, `lotes_con_faltante` (INTEGER)
- `criterio_ponderacion` (TEXT)

### 2.11. `auditoria`
- `id` (UUID, PK)
- `usuario_id` (UUID, FK → `usuarios.id`)
- `usuario_nombre`, `accion`, `entidad`, `registro_id` (TEXT)
- `valor_anterior`, `valor_nuevo` (JSONB)
- `fecha_hora` (TIMESTAMPTZ)

