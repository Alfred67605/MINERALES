# MANUAL DE USUARIO PASO A PASO — MineralFlow Bolivia

Este manual está diseñado para que cualquier operador de almacén, encargado de compras, comercializador o administrador utilice **MineralFlow** con facilidad.

---

## 1. Inicio de Sesión y Selección de Perfil

1. Abra su navegador en `http://localhost:5173`.
2. Ingrese su **Usuario o Correo Electrónico** y su **Contraseña** (en modo demostración puede hacer clic sobre cualquiera de las 4 tarjetas de perfil para autocompletar las credenciales).
3. Haga clic en **"Ingresar a MineralFlow"**.
4. *(Opcional)* Si desea ver la presentación audiovisual de 5 escenas del sistema, pulse el botón **"Ver Presentación HyperFrames"** en la esquina superior derecha o en el menú lateral.

---

## 2. Dashboard Principal

Al ingresar verá el resumen general de la comercializadora:
- **6 tarjetas superiores** con los lotes registrados, disponibles en almacén, vendidos, total de sacos y pesos en kilogramos (`kg`) y toneladas métricas (`TM`).
- **Diagrama de flujo de almacén** que muestra entradas de cooperativas/minas, stock disponible y despachos de venta.
- **Gráficos interactivos** de evolución de peso disponible, distribución por proveedor y proporción de estados.

---

## 3. Cómo Registrar una Compra y sus Lotes (Módulo 2)

*(Disponible para roles **Almacenero** y **Administrador**)*

1. En el menú lateral izquierdo, haga clic en **"Compras y Lotes"**.
2. Pulse el botón verde **"Nueva Compra y Lotes"**.
3. Seleccione el **Proveedor o Cooperativa**, la **Fecha de Compra** y observaciones opcionales.
4. Complete los datos del lote:
   - **N.º de Lote** (ej. `LT-2026-0205`).
   - **Tipo de Mineral** (ej. `Complejo Zn-Ag-Pb`).
   - **Mina de Origen**, **Cantidad de Sacos**, **Peso Neto** y **Unidad (`KG` o `TM`)**.
   - **Análisis Químico de Leyes Minerales**: elija el elemento (`Zn %`, `Ag g/t`, `Pb %`, `Sn %`) e ingrese su valor. Puede pulsar **"+ Añadir otra ley mineral"** si el lote tiene múltiples elementos.
5. Si la compra incluye varios lotes, pulse **"+ Agregar Otro Lote a la Compra"**.
6. Haga clic en **"Confirmar Compra"**. Todos los lotes ingresarán inmediatamente con estado **`DISPONIBLE`**.

---

## 4. Cómo Consultar el Almacén de Minerales (Módulo 3)

1. En el menú lateral, haga clic en **"Almacén Disponible"**.
2. Por defecto se muestran únicamente los lotes en estado **`DISPONIBLE`**.
3. En la barra superior verá el resumen de lotes, sacos, peso total y leyes promedio del inventario filtrado.
4. Puede ordenar haciendo clic en los encabezados de columna (**N.º Lote**, **Fecha**, **Proveedor**, **Sacos**, **Peso**) o pulsar **"Detalle"** en cualquier fila para abrir su ficha técnica.

---

## 5. Cómo Seleccionar 10, 20 o 40+ Lotes y Calcular Leyes en Tiempo Real (Módulos 4 y 5)

1. En el menú lateral, haga clic en **"Selección y Venta"**.
2. Dispone de cuatro métodos complementarios para elegir los lotes que desea vender:
   - **Casilla individual**: Haga clic sobre cualquier fila o su casilla para agregar o quitar el lote.
   - **Selección por Rango (`Shift + Clic`)**:
     1. Haga clic en el primer lote del rango.
     2. Mantenga presionada la tecla `Shift` en su teclado.
     3. Haga clic en el último lote del rango: todas las filas intermedias se marcarán automáticamente.
   - **Agrupación rápida**: Pulse los botones **`10 lotes`**, **`20 lotes`** o **`40 lotes`** o bien **"Seleccionar todos los resultados filtrados"**.
3. **Verificación del Grupo (`VER SOLO SELECCIONADOS`)**:
   - Pulse el botón **"VER SOLO SELECCIONADOS"** arriba a la derecha para ocultar el resto del almacén y revisar únicamente los lotes elegidos.
   - Puede buscar, filtrar o cambiar de página en cualquier momento sin perder nunca su selección.
4. **Barra Flotante Inferior en Tiempo Real**:
   - En la parte inferior de la pantalla verá siempre actualizados al instante:
     `LOTES | SACOS | PESO TOTAL | LEY PROMEDIO PONDERADA`.

---

## 6. Cómo Confirmar y Cerrar una Venta (Módulo 6)

*(Disponible para roles **Vendedor** y **Administrador**)*

1. Una vez revisados los lotes seleccionados en la barra inferior, haga clic en **"Continuar con la Venta"**.
2. En la ventana de confirmación:
   - Seleccione el **Comprador o Empresa Destinataria**.
   - Verifique la **Fecha de Venta** y agregue observaciones si corresponde.
   - Revise el cuadro de **Cálculos Definitivos de la Operación** (total de lotes, sacos, peso total y promedios ponderados por cada ley mineral).
3. Haga clic en **"Confirmar y Cerrar Venta"**.
4. El sistema ejecutará una transacción segura en la base de datos: creará la venta, cambiará todos los lotes a **`VENDIDO`** y los retirará del almacén disponible.

---

## 7. Cómo Consultar el Historial de Ventas y Exportar Reportes (Módulo 7)

1. En el menú lateral, haga clic en **"Historial de Ventas"**.
2. Puede buscar ventas por número (`VTA-2026-0001`), filtrar por comprador, rango de fechas o **buscar en qué venta se incluyó un número de lote específico**.
3. Haga clic en **"Abrir Venta"** para ver el expediente completo con la copia histórica de todos los lotes vendidos y sus leyes.
4. Utilice los botones **"PDF"**, **"CSV / Excel"** o **"Imprimir"** para generar los reportes oficiales con datos reales.

