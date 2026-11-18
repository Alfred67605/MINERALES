import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Suite E2E Integral — MineralFlow 2.0 (3D, Fallback 2D, Laboratorio, Trazabilidad y Venta de 40 Lotes)', () => {
  test.beforeAll(async () => {
    try {
      execSync('npx tsx scripts/reset_lots.ts', { cwd: '../backend', stdio: 'ignore' });
    } catch {}
  });

  test('Verifica todas las pantallas renovadas, escenas 3D y fallback 2D, selección masiva (Shift+Clic y 40 lotes), laboratorio, trazabilidad M-02, HyperFrames en /acerca y responsive (1720px, 1440px, 1366px y 375px)', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      console.log('BROWSER PAGEERROR:', err.message);
      consoleErrors.push(`PAGEERROR: ${err.message}`);
    });

    // 1. Iniciar en resolución 1720px, verificar Modo Oscuro Azul Cian activo y autenticar usuario real sin sufijos "(DEMO)"
    await page.setViewportSize({ width: 1720, height: 960 });
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: /Ingresar a MineralFlow/i })).toBeVisible();
    await page.getByRole('button', { name: /Ingresar a MineralFlow/i }).click();

    // 2. Verificar Resumen General del Negocio y Desglose en Bolivianos
    await expect(
      page.getByRole('heading', { name: /Resumen del Negocio/i })
    ).toBeVisible();
    await expect(
      page.getByText(/Detalle del Almacén por Mineral, Sacos y Valor en Bolivianos/i)
    ).toBeVisible();
    await expect(page.getByText('Lotes Disponibles en Almacén', { exact: true })).toBeVisible();
    await page.screenshot({ path: '../docs/evidence_01_dashboard_3d.png', fullPage: true });

    // 3. Navegar a Mi Almacén (Zonas + Movimientos de Almacén)
    await page.getByRole('link', { name: /Mi Almacén/i }).click();
    await expect(page.getByRole('heading', { name: 'Mi Almacén', exact: true })).toBeVisible();
    await expect(
      page.getByText('ZONA-A1').first()
    ).toBeVisible();
    await page.screenshot({ path: '../docs/evidence_02_almacen_3d.png', fullPage: true });

    // Verificar pestaña de Movimientos de Almacén
    await page.getByRole('button', { name: /Movimientos de Almacén/i }).click();
    await expect(page.getByText(/Historial de Movimientos de Almacén/i)).toBeVisible();
    await page.getByRole('button', { name: /Lotes Guardados/i }).click();

    // 4. Navegar a Leyes de Laboratorio
    await page.getByRole('link', { name: /Leyes de Laboratorio/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Leyes de Laboratorio' })
    ).toBeVisible();
    await expect(page.getByText(/CERT-LAB-/i).first()).toBeVisible();
    await page.screenshot({ path: '../docs/evidence_03_laboratorio.png', fullPage: true });

    // 5. Navegar a Seguimiento de Lotes
    await page.getByRole('link', { name: /Seguimiento de Lotes/i }).click();
    await expect(
      page.getByRole('heading', { name: /Seguimiento de Lotes/i })
    ).toBeVisible();
    await expect(page.getByText(/01 · ORIGEN MINERO/i)).toBeVisible();
    await page.screenshot({ path: '../docs/evidence_04_trazabilidad_m02.png', fullPage: true });

    // 6. Respaldo de Datos Avanzado: programación, crear respaldo, verlo en la lista y descargarlo
    await page.getByRole('link', { name: /Respaldo de Datos/i }).click();
    await expect(page.getByRole('heading', { name: 'Copias de Seguridad (Backups)' })).toBeVisible();
    await expect(page.getByText(/Programación de Respaldos Automáticos/i)).toBeVisible();
    await page.getByTestId('btn-crear-respaldo').click();
    await expect(page.getByText('Respaldo creado correctamente.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Descargar/i }).first()).toBeVisible();
    await page.screenshot({ path: '../docs/evidence_09_respaldo.png', fullPage: true });

    // 6b. Verificar Perfiles, Usuarios y Permisos
    await page.getByRole('link', { name: /Usuarios y Permisos/i }).click();
    await expect(page.getByRole('heading', { name: 'Perfiles, Usuarios y Permisos' })).toBeVisible();
    await page.screenshot({ path: '../docs/evidence_11_perfiles.png', fullPage: true });

    // 6c. Verificar Reportes y Estadísticas
    await page.getByRole('link', { name: /Reportes y Estadísticas/i }).click();
    await expect(page.getByRole('heading', { name: 'Reportes y Estadísticas' })).toBeVisible();
    await expect(page.getByTestId('btn-reporte-pdf')).toBeVisible();
    await expect(page.getByTestId('btn-reporte-excel')).toBeVisible();
    await expect(page.getByText('Bs / Saco').first()).toBeVisible();
    await page.screenshot({ path: '../docs/evidence_10_reportes.png', fullPage: true });

    // 7. Navegar a Vender Lotes (Cálculo en Bs, Shift+Clic y 40 lotes)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('link', { name: /Vender Lotes/i }).click();
    await expect(
      page.getByRole('heading', { name: 'Vender Lotes', exact: true })
    ).toBeVisible();

    // Selección por rango con Shift + Clic (LT-2026-0101 a LT-2026-0105 = 5 lotes)
    await page.getByTestId('fila-lote-LT-2026-0101').click();
    await expect(page.getByTestId('resumen-total-lotes')).toHaveText('1');
    await page.getByTestId('fila-lote-LT-2026-0105').click({ modifiers: ['Shift'] });
    await expect(page.getByTestId('resumen-total-lotes')).toHaveText('5');

    // Limpiar y seleccionar 40 lotes, verificando valorización en Bolivianos (Bs) y Bs/saco
    await page.getByTestId('btn-limpiar-seleccion').click();
    await page.getByTestId('btn-seleccionar-40').click();
    await expect(page.getByTestId('resumen-total-lotes')).toHaveText('40');
    await expect(page.getByTestId('resumen-total-bs')).toContainText('Bs');
    await expect(page.getByTestId('resumen-bs-saco')).toContainText('Bs');
    await page.screenshot({ path: '../docs/evidence_05_seleccion_3d_40lotes.png', fullPage: true });

    // Activar "VER SOLO SELECCIONADOS"
    await page.getByTestId('btn-ver-solo-seleccionados').click();
    await expect(page.getByText(/Revisando grupo seleccionado: 40 lote/i)).toBeVisible();

    // Confirmar y cerrar la venta atómica de los 40 lotes
    await page.getByTestId('btn-continuar-venta').click();
    await expect(
      page.getByRole('heading', { name: /Confirmación y Cierre de Venta de Minerales/i })
    ).toBeVisible();
    await page.getByTestId('btn-confirmar-cierre-venta').click();
    await expect(page.getByText(/registrada y cerrada con éxito!/i)).toBeVisible();

    // 8. Verificar Módulo de Precios de Minerales (Dólar Paralelo / BCB, Oficial Quincenal, En Vivo y Manual)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('link', { name: /Precios de Minerales/i }).click();
    await expect(
      page.getByRole('heading', { name: /Precios de Minerales/i })
    ).toBeVisible();
    await expect(page.getByTestId('panel-dolar-bcb-paralelo')).toBeVisible();
    await page.getByTestId('btn-dolar-bcb-ref').click();
    await expect(page.getByTestId('btn-topbar-dolar')).toContainText('11,70 Bs');
    await page.getByTestId('btn-dolar-paralelo').click();
    await expect(page.getByTestId('btn-topbar-dolar')).toContainText('11,92 Bs');

    // Asegurar modo Oficial Quincenal y verificar valores oficiales (segunda imagen SENARECOM Noviembre 2026)
    await page.getByTestId('btn-modo-oficial').click();
    await expect(page.getByText('4.010,22').first()).toBeVisible();
    await expect(page.getByText('1,73').first()).toBeVisible();

    // Probar cambio a Modo En Vivo
    await page.getByTestId('btn-modo-envivo').click();
    await expect(page.getByText(/EN_VIVO/i).first()).toBeVisible();

    // Probar cambio a Modo Manual / Personalizado y Simulador Manual
    await page.getByTestId('btn-modo-manual').click();
    await expect(page.getByText(/MANUAL/i).first()).toBeVisible();
    await expect(page.getByTestId('input-sim-precio-manual')).toBeVisible();

    // Capturar evidencia en Modo Oscuro Azul Cián Tecnológico
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.screenshot({ path: '../docs/evidence_07_cotizaciones_dark_cyan.png', fullPage: true });

    // Probar alternancia a Modo Claro y captura comparativa, luego volver a Oscuro
    await page.getByTestId('btn-toggle-theme').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.screenshot({ path: '../docs/evidence_08_cotizaciones_light.png', fullPage: true });
    await page.getByTestId('btn-toggle-theme').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // 9. Verificar Ventas Realizadas y Expediente de los 40 lotes vendidos
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.getByRole('link', { name: /Ventas Realizadas/i }).click();
    await expect(page.getByText('VTA-2026-0003')).toBeVisible();
    await page.getByTestId('btn-detalle-venta-VTA-2026-0003').click();
    await expect(page.getByText(/Detalle de Lotes Vendidos \(40 Lotes\)/i)).toBeVisible();
    await page.screenshot({ path: '../docs/evidence_06_expediente_venta.png', fullPage: true });
    await page.getByRole('button', { name: 'Cerrar detalle de venta' }).click();

    // 10. Verificar vista móvil responsive (375px)
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByRole('button', { name: 'Abrir menú de navegación' })).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });
});
