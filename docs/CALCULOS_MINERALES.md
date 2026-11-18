# MOTOR MATEMÁTICO DE PESOS, HUMEDAD Y LEYES — MINERALFLOW 2.0

## 1. Precisión Numérica y Cero Flotantes Binarios

Todo el motor de cálculo (`backend/src/utils/calculations.ts` y `frontend/src/utils/calculations.ts`) opera con **`Decimal.js`** configurado a **28 dígitos de precisión significativa** (`ROUND_HALF_UP`) y persiste en PostgreSQL mediante columnas **`DECIMAL(14,4)`**. Jamás se utiliza `float` binario para cantidades comerciales.

---

## 2. Fórmulas de Pesaje y Descuento de Humedad (ISO 10251)

### 2.1. Peso Neto Húmedo
$$\text{Peso Neto Húmedo} = \text{Peso Bruto Húmedo} - \text{Tara}$$

### 2.2. Conversión de Unidades Compatibles
$$1\text{ TM (Tonelada Métrica)} = 1.000\text{ KG}$$

### 2.3. Peso Neto Seco (cuando aplica descuento de humedad)
$$\text{Peso Neto Seco (kg)} = \text{Peso Neto Húmedo (kg)} \times \left(1 - \frac{\text{Humedad (\%)}}{100}\right)$$

**Ejemplo verificado en Test 6:**
- $\text{Peso Bruto} = 1.545,50\text{ kg}$, $\text{Tara} = 45,50\text{ kg} \implies \text{Peso Neto Húmedo} = 1.500,00\text{ kg}$.
- $\text{Humedad} = 5,00\% \implies \text{Peso Neto Seco} = 1.500,00 \times (1 - 0,05) = 1.425,00\text{ kg}$.

---

## 3. Promedio Ponderado por Elemento y Unidad

Para cada elemento y unidad compatible (`Zn %`, `Pb %`, `Sn %`, `Ag g/t`, `Ag DM`):

$$\text{Ley Promedio Ponderada} = \frac{\sum_{i \in S} \left(\text{Peso Base}_{i} \times \text{Ley}_{i}\right)}{\sum_{i \in S} \text{Peso Base}_{i}}$$

Donde $S$ es el subconjunto de lotes seleccionados que cuentan con medición válida (`VALIDADO`, `MEDIDO` o `CERO_MEDIDO`) para dicha ley.

### Casos de Prueba Oficiales Verificados
1. **Ley Porcentual (`%`) — Prueba 3**:
   - Lote A: $1.000\text{ kg}$ a $40\%$
   - Lote B: $2.000\text{ kg}$ a $50\%$
   - Resultado: $\frac{1.000 \times 40 + 2.000 \times 50}{3.000} = \frac{140.000}{3.000} = 46,6667\% \rightarrow \mathbf{46,67\%}$.
2. **Ley en Gramos por Tonelada (`g/t`) — Prueba 4**:
   - Lote 1: $1\text{ t}$ ($1.000\text{ kg}$) a $200\text{ g/t}$
   - Lote 2: $2\text{ t}$ ($2.000\text{ kg}$) a $300\text{ g/t}$
   - Resultado: $\frac{1.000 \times 200 + 2.000 \times 300}{3.000} = \frac{800.000}{3.000} = 266,6667\text{ g/t} \rightarrow \mathbf{266,67\text{ g/t}}$.

---

## 4. Cálculo de Contenido Fino Respetando Dimensiones Físicas

1. **Para Leyes Porcentuales (`%`)**:
   $$\text{Contenido Fino (kg)} = \frac{\text{Peso Base Ponderado (kg)} \times \text{Ley Promedio (\%)}}{100}$$
2. **Para Leyes en Gramos por Tonelada (`g/t`)**:
   $$\text{Contenido Fino (g)} = \left(\frac{\text{Peso Base Ponderado (kg)}}{1.000}\right) \times \text{Ley Promedio (g/t)}$$

---

## 5. Cobertura de Datos y Distinción entre Faltante y Cero Medido

- **Cero Medido (`CERO_MEDIDO`)**: El laboratorio midió el elemento y determinó $0,00$; su peso **sí** se incluye en el denominador.
- **Faltante / No Medido / Bajo Límite de Detección (`SIN_DATO`, `NO_MEDIDO`, `BAJO_LIMITE_DETECCION`)**: **Jamás se asume como cero**. Se excluye del denominador de esa ley específica y se calcula el porcentaje explícito de cobertura:
  $$\text{Cobertura (\%)} = \frac{\text{Lotes con análisis válido}}{\text{Total de lotes seleccionados}} \times 100$$
  Si la cobertura es menor al $100\%$, el sistema emite una advertencia visible indicando exactamente cuántos lotes poseen dicho análisis (ej. `Cobertura: 38/40 lotes (95.0%)`).

