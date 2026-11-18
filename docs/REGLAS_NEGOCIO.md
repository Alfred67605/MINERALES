# REGLAS DE NEGOCIO Y OPERACIÓN MINERA — MINERALFLOW 2.0

## 1. Recepción, Estados y Compatibilidad Retroactiva

1. **Estado Predeterminado `DISPONIBLE`**:
   Para preservar la fluidez operativa existente, todo lote registrado correctamente en una recepción de compra ingresa por defecto con estado `DISPONIBLE` y genera automáticamente su movimiento inicial `RECEPCION_COMPRA` en el Kardex de inventario.
2. **Flujo Opcional de Validación**:
   El esquema soporta estados intermedios (`BORRADOR`, `PENDIENTE_ANALISIS`, `APROBADO`, `RESERVADO`) sin alterar retroactivamente ninguno de los lotes históricos.
3. **Inmutabilidad de Lotes y Ensayes Vendidos**:
   Una vez que un lote pasa a estado `VENDIDO`, tanto sus cantidades/pesos (`PUT /api/lotes/:id`) como sus certificados de laboratorio (`PUT /api/laboratorio/ensayes/:id`) quedan bloqueados con `HTTP 409 Conflict`, protegiendo la integridad histórica de las ventas cerradas.

---

## 2. Reglas de Consolidación y Cierre Atómico de Venta

1. **Un Comprador por Venta, Múltiples Lotes**:
   Cada operación de venta asocia $N$ lotes disponibles ($1, 10, 20, 40+$) a un único comprador activo.
2. **Transacción ACID Serializable + Bloqueo Condicional**:
   El cierre de venta verifica que todos los lotes existan y estén en estado `DISPONIBLE`. Si un solo lote del grupo ya fue vendido por otro usuario, toda la operación se cancela (`ROLLBACK`) e informa cuáles lotes causaron el conflicto.
3. **Idempotencia ante Reintentos (`idempotencyKey`)**:
   Cada cierre de venta envía una llave `x-idempotency-key` (`idempotency_key UNIQUE` en `ventas`). Si el cliente reintenta la misma solicitud por latencia o doble envío, el backend devuelve de forma idempotente la venta ya creada sin duplicar registros ni arrojar error falso.
4. **Snapshots Históricos Inmutables**:
   Al cerrar la venta, `detalle_ventas` y `resumen_leyes_venta` guardan una fotografía inmutable del nombre y NIT del comprador, proveedor original, mina de origen, sacos, peso húmedo, peso seco, humedad, leyes individuales, leyes promedio ponderadas, contenido fino y porcentaje de cobertura.

---

## 3. Alcance de la Asistencia Documental Normativa (Bolivia)

- **Formulario M-02, NIM/NIAR y M-03**:
  El sistema registra el código de expediente interno M-02, su estado documental (`PENDIENTE`, `RECIBIDO`, `VERIFICADO`), el número NIM/NIAR del proveedor/operador, boletos de pesaje y certificados químicos conforme a las referencias de **SENARECOM** e **ISO 12743 / ISO 10251**.
- **Delimitación Legal Explícita**:
  Todas las pantallas y reportes especifican que esta función constituye **asistencia documental interna** y no sustituye la emisión ni validación oficial ante la plataforma SINACOM de SENARECOM.

