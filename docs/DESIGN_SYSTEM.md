# SISTEMA DE DISEÑO 2.0 — MINERALFLOW ("GEOLOGÍA DE PRECISIÓN + TECNOLOGÍA COMERCIAL")

## 1. Filosofía Visual y Dirección de Arte

**MineralFlow 2.0** abandona la estética de plantilla administrativa convencional para adoptar una identidad industrial, geológica y ejecutiva diseñada específicamente para comercializadoras e ingenios mineros en Bolivia.

### Principios Rectores
1. **Jerarquía Asimétrica e Intencional**: El Dashboard no comienza con seis tarjetas idénticas en grilla; abre con un **Command Center 3D interactivo** acompañado de indicadores jerarquizados por relevancia operativa, sparklines de tendencia y contexto documental.
2. **Claridad Industrial a Cualquier Escala**: Tipografía editorial (`Instrument Serif`) reservada exclusivamente para encabezados de alto impacto; cuerpo operativo en `Plus Jakarta Sans` de alta legibilidad; y **cifras estrictamente tabulares (`JetBrains Mono`, `tabular-nums`)** para pesos brutos, taras, humedades, pesos secos, leyes y contenidos finos.
3. **Densidad Visual Configurable**: El operador puede alternar en cualquier momento entre vista **Cómoda** (espaciado amplio para análisis ejecutivo) y vista **Compacta** (alta densidad de filas para selección masiva de 40+ lotes en pantallas de 1366px, 1440px y 1720px).
4. **3D Funcional con Fallback Transparente**: Cada escena 3D (`Command Center`, `Almacén Virtual Conceptual`, `Agrupador de Venta`) responde a datos reales de PostgreSQL y cuenta con controles explícitos de encendido/apagado y calidad (`Automática`, `Alta`, `Baja`) sin bloquear jamás la operación 2D.

---

## 2. Paleta de Colores Oficial (Tokens Semánticos)

| Token CSS | Hexadecimal | Uso Semántico y Contraste WCAG |
|---|---|---|
| `--bg-ivory` | `#F7F4EE` | Lienzo principal marfil cálido (sin fatiga visual en turnos largos) |
| `--bg-surface` | `#FFFFFF` | Superficie primaria de tablas, drawers, wizards y tarjetas |
| `--bg-sand` | `#EDE6D8` | Arena geológica para cabeceras de tabla, paneles secundarios y chips |
| `--primary-mineral` | `#174A3C` | Verde mineral profundo — acción primaria única por vista y navegación activa |
| `--secondary-jade` | `#29755B` | Jade mineral — indicadores de disponibilidad, cobertura completa y estados validados |
| `--accent-copper` | `#B76543` | Cobre andino — acento para lotes vendidos, salidas de almacén y alertas |
| `--accent-gold` | `#C49A44` | Oro mineral — bordes de destaque, ensayes certificados y métricas ponderadas |
| `--graphite-warm` | `#252B29` | Grafito cálido — texto principal e iconos estructurales (contraste > 12:1 sobre `#F7F4EE`) |
| `--text-muted` | `#5C6460` | Gris pizarra — etiquetas secundarias, metadatos y subtítulos (contraste > 5.2:1) |
| `--border-subtle` | `#DDD5C7` | Borde estructural fino de 1px entre superficies y celdas |

---

## 3. Escala Tipográfica y Sistema 8pt Spacing

- **Display / Hero Title**: `Instrument Serif`, `2.25rem` – `2.75rem`, `line-height: 1.08`, `letter-spacing: -0.02em`.
- **Section Heading (H2)**: `Plus Jakarta Sans`, `1.125rem` (`18px`), `font-weight: 700`.
- **Table & Form Label**: `Plus Jakarta Sans`, `0.75rem` (`12px`), `font-weight: 700`, `letter-spacing: 0.04em`.
- **Numeric Cell / Assay Badge**: `JetBrains Mono`, `0.8125rem` (`13px`), `font-variant-numeric: tabular-nums`.
- **Ritmo Espacial (8pt Grid)**: `4px` (`0.5`), `8px` (`1`), `16px` (`2`), `24px` (`3`), `32px` (`4`), `48px` (`6`).

---

## 4. Arquitectura de Componentes y Patrones de Interacción

1. **Sidebar con Identidad de Producto y 4 Dominios**:
   - **Operación**: Dashboard Ejecutivo, Recepción y Compras (Stepper), Almacén y Kardex (2D/3D).
   - **Comercial**: Selección y Agrupador 3D, Historial y Expedientes de Venta, Proveedores, Minas y Compradores.
   - **Análisis**: Laboratorio y Ensayes Mineralógicos, Trazabilidad y Normativa M-02.
   - **Administración**: Seguridad, Roles y Auditoría, Acerca del Sistema (Presentación HyperFrames).
2. **Drawers Laterales en lugar de Modales Gigantes**:
   - La inspección detallada de un lote, su boleto de pesaje, versiones de laboratorio, documentos adjuntos y trazabilidad se abre en un **Drawer lateral deslizante** a la derecha, manteniendo el contexto de la tabla visible.
3. **Wizards Guiados (Steppers)**:
   - Tanto el **Registro de Compra y Recepción** como la **Confirmación y Liquidación de Venta** utilizan un flujo guiado por pasos claros con validación en cada etapa.

