# REGLAS DE NEGOCIO Y CÁLCULOS MINERALÚRGICOS — MineralFlow

## 1. Ciclo de Vida y Estados del Lote

1. **Ingreso Automático (`DISPONIBLE`)**:
   Todo lote registrado correctamente dentro de una compra ingresa automáticamente con el estado `DISPONIBLE` y aparece de inmediato en el Almacén de Minerales y en la pantalla de Selección para Venta.
2. **Transición a `VENDIDO`**:
   Únicamente mediante la confirmación atómica de una operación de venta (`POST /api/ventas`), todos los lotes seleccionados cambian simultáneamente a estado `VENDIDO` y dejan de mostrarse en el inventario disponible.
3. **Inmutabilidad de Lotes Vendidos**:
   Un lote en estado `VENDIDO` no puede modificar sus cantidades de sacos, pesos ni leyes originales (`HTTP 409 Lote vendido inmutable`), ni tampoco eliminarse físicamente.

---

## 2. Motor de Cálculo de Ley Promedio Ponderada

### 2.1. Fórmula Matemática Oficial

Para cada ley mineral compatible (mismo elemento y misma unidad de medición):

$$\text{Ley promedio} = \frac{\sum_{i=1}^{n} (\text{Peso}_{\text{kg}, i} \times \text{Ley}_{i})}{\sum_{i=1}^{n} \text{Peso}_{\text{kg}, i}}$$

### 2.2. Ejemplo de Verificación Exacta
- **Lote A**: Peso = $1.000\text{ kg}$, Ley = $40\%$
- **Lote B**: Peso = $2.000\text{ kg}$, Ley = $50\%$
- **Cálculo**:
  $$\frac{(1.000 \times 40) + (2.000 \times 50)}{1.000 + 2.000} = \frac{40.000 + 100.000}{3.000} = \frac{140.000}{3.000} = 46,6667\% \approx 46,67\%$$

*(Nunca se confunde con el promedio aritmético simple, que daría erróneamente $45,00\%$).*

---

## 3. Reglas Estrictas de Cálculo y Validación

1. **Precisión Decimal sin Redondeo Acumulado**: Se utiliza `Decimal.js` con 28 dígitos significativos durante toda la sumatoria de productos $\sum(\text{Peso} \times \text{Ley})$ y solo se formatea al presentar el resultado final.
2. **Conversión Automática de Unidades de Peso Compatibles**:
   - Si un lote está expresado en Toneladas Métricas (`TM`), se convierte automáticamente a Kilogramos (`1 TM = 1.000 KG`) antes de ponderar.
3. **Separación Estricta de Minerales y Unidades Incompatibles**:
   - Jamás se mezclan leyes de distintos elementos (`Zn` con `Pb` o `Sn`).
   - Jamás se mezclan unidades de medición distintas para un mismo mineral (por ejemplo, Plata en `DM` Decimarcos se calcula por separado de Plata en `g/t` gramos por tonelada).
4. **Manejo de Leyes Faltantes (No Asumir Cero)**:
   - Si en un grupo de 40 lotes, 38 tienen ley de Plata (`Ag`) y 2 lotes no tienen análisis de Plata, el denominador $\sum \text{Peso}$ para Plata incluye únicamente el peso de los 38 lotes analizados, y el sistema muestra una **advertencia explícita** indicando cuántos lotes carecen de dicho análisis.
5. **Criterio de Peso Documentado**:
   - Por defecto, el sistema pondera sobre el **Peso Neto convertido a Kilogramos (`PESO_NETO_CONVERTIDO_KG`)** registrado en balanza, con soporte opcional en el motor para ponderar sobre **Peso Seco (`PESO_SECO_CONVERTIDO_KG`)** cuando el lote registre descuento de humedad.

---

## 4. Integridad Atómica y Control de Concurrencia en Ventas

1. **Transacción ACID Serializable**:
   El cierre de venta se ejecuta dentro de `prisma.$transaction(..., { isolationLevel: Serializable })`.
2. **Verificación y Bloqueo Condicional**:
   Se ejecuta una actualización atómica `UPDATE lotes SET estado = 'VENDIDO' WHERE id IN (...) AND estado = 'DISPONIBLE'`. Si el conteo de filas actualizadas difiere del total de lotes solicitados, toda la transacción hace `ROLLBACK` inmediato y devuelve `HTTP 409 Conflicto`, impidiendo ventas parciales silenciosas o ventas duplicadas por doble clic o usuarios simultáneos.

