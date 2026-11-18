import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  calcularResumenLotes,
  calcularPesoNetoHumedo,
  calcularPesoSecoDesdeHumedad,
  LoteCalculoInput,
} from './utils/calculations.js';
import { buildApp } from './server.js';
import { prisma } from './db.js';
import { seedDatabase } from '../prisma/seed.js';

describe('SUITE INTEGRAL MINERALFLOW 2.0 — 12 PRUEBAS ESPECÍFICAS DE PRECISIÓN, NEGOCIO, CONCURRENCIA, IDEMPOTENCIA Y SEGURIDAD', () => {
  let app: any;
  let tokenAdmin: string;
  let tokenAlmacenero: string;
  let tokenVendedor: string;
  let tokenLaboratorio: string;
  let tokenConsulta: string;

  beforeAll(async () => {
    await seedDatabase();
    app = await buildApp();
    await app.ready();

    const loginRole = async (username: string) => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { identificador: username, password: 'DemoMineral2026!' },
      });
      return res.json().token as string;
    };

    tokenAdmin = await loginRole('admin');
    tokenAlmacenero = await loginRole('almacenero');
    tokenVendedor = await loginRole('vendedor');
    tokenLaboratorio = await loginRole('laboratorio');
    tokenConsulta = await loginRole('consulta');
  }, 60000);

  afterAll(async () => {
    // Restaurar exactamente la línea base de 51 lotes (45 disponibles + 6 vendidos) al concluir las pruebas
    await seedDatabase();
    if (app) await app.close();
    await prisma.$disconnect();
  }, 60000);

  // =========================================================================
  // PRUEBA ESPECÍFICA 1 — PRESERVACIÓN DE CONTEOS DE LÍNEA BASE
  // =========================================================================
  describe('Prueba 1 — Preservación de Conteos Baseline tras Migración v2.0', () => {
    it('Verifica que los 51 lotes (45 disponibles, 6 vendidos, 1.260 sacos disponibles, 88.200 kg disponibles y 11.280 kg vendidos) estén intactos', async () => {
      const dashRes = await app.inject({
        method: 'GET',
        url: '/api/dashboard',
        headers: { authorization: `Bearer ${tokenAdmin}` },
      });
      expect(dashRes.statusCode).toBe(200);
      const ind = dashRes.json().indicadores;

      expect(ind.totalLotesRegistrados).toBe(51);
      expect(ind.lotesDisponibles).toBe(45);
      expect(ind.lotesVendidos).toBe(6);
      expect(ind.totalSacosDisponibles).toBe(1260);
      expect(ind.pesoTotalDisponibleKg).toBe(88200);
      expect(ind.pesoTotalVendidoKg).toBe(11280);
    });
  });

  // =========================================================================
  // PRUEBAS ESPECÍFICAS 3, 4, 5 y 6 — MOTOR MATEMÁTICO DE PESOS, HUMEDAD Y LEYES
  // =========================================================================
  describe('Pruebas 3, 4, 5 y 6 — Fórmulas de Pesos (Bruto/Tara/Seco) y Promedios Ponderados', () => {
    it('Prueba 3: Promedio ponderado porcentual exacto: 1.000 kg @ 40% + 2.000 kg @ 50% = 46,6667% (46,67%)', () => {
      const lotes: LoteCalculoInput[] = [
        {
          id: '1',
          numeroLote: 'LT-A',
          cantidadSacos: 20,
          pesoNeto: '1000',
          unidadPeso: 'KG',
          tipoMineral: 'Complejo Zn',
          leyes: [
            { codigoLey: 'ZN_PCT', mineral: 'Zinc', simbolo: 'Zn', nombreLey: 'Ley de Zinc', unidadMedida: '%', valor: '40' },
          ],
        },
        {
          id: '2',
          numeroLote: 'LT-B',
          cantidadSacos: 40,
          pesoNeto: '2000',
          unidadPeso: 'KG',
          tipoMineral: 'Complejo Zn',
          leyes: [
            { codigoLey: 'ZN_PCT', mineral: 'Zinc', simbolo: 'Zn', nombreLey: 'Ley de Zinc', unidadMedida: '%', valor: '50' },
          ],
        },
      ];

      const res = calcularResumenLotes(lotes);
      expect(res.esValido).toBe(true);
      expect(res.pesoTotalKg).toBe('3000.0000');
      expect(res.promediosLeyes[0].leyPromedio).toBe('46.6667');
      expect(res.promediosLeyes[0].leyPromedioRedondeada).toBe('46.67');
      // Contenido fino: 3.000 kg * 46,666666...% = 1.400 kg finos
      expect(res.promediosLeyes[0].contenidoFino).toBe('1400.0000');
    });

    it('Prueba 4: Ensaye de ley Ag en g/t: 1 t @ 200 g/t + 2 t @ 300 g/t = 266,6667 g/t (266,67 g/t) y 800 g finos', () => {
      const lotes: LoteCalculoInput[] = [
        {
          id: 'ag-1',
          numeroLote: 'LT-AG1',
          cantidadSacos: 20,
          pesoNeto: '1',
          unidadPeso: 'TM', // 1 t = 1.000 kg
          tipoMineral: 'Complejo Ag',
          leyes: [
            { codigoLey: 'AG_GT', mineral: 'Plata', simbolo: 'Ag', nombreLey: 'Ley de Plata (g/t)', unidadMedida: 'g/t', valor: '200' },
          ],
        },
        {
          id: 'ag-2',
          numeroLote: 'LT-AG2',
          cantidadSacos: 40,
          pesoNeto: '2',
          unidadPeso: 'TM', // 2 t = 2.000 kg
          tipoMineral: 'Complejo Ag',
          leyes: [
            { codigoLey: 'AG_GT', mineral: 'Plata', simbolo: 'Ag', nombreLey: 'Ley de Plata (g/t)', unidadMedida: 'g/t', valor: '300' },
          ],
        },
      ];

      const res = calcularResumenLotes(lotes);
      expect(res.pesoTotalKg).toBe('3000.0000');
      expect(res.promediosLeyes[0].leyPromedio).toBe('266.6667');
      expect(res.promediosLeyes[0].leyPromedioRedondeada).toBe('266.67');
      // Fino (g) = 1t*200 + 2t*300 = 800 g finos
      expect(res.promediosLeyes[0].contenidoFino).toBe('800.0000');
      expect(res.promediosLeyes[0].unidadFino).toBe('g finos');
    });

    it('Prueba 5: Comprueba que una ley faltante o NO_MEDIDO NO es cero y reporta cobertura parcial explícita', () => {
      const lotes: LoteCalculoInput[] = [
        {
          id: '1',
          numeroLote: 'LT-1',
          cantidadSacos: 20,
          pesoNeto: '1000',
          unidadPeso: 'KG',
          tipoMineral: 'Complejo Zn-Ag',
          leyes: [
            { codigoLey: 'ZN_PCT', mineral: 'Zinc', simbolo: 'Zn', nombreLey: 'Ley de Zinc', unidadMedida: '%', valor: '45', estadoMedicion: 'VALIDADO' },
            { codigoLey: 'PB_PCT', mineral: 'Plomo', simbolo: 'Pb', nombreLey: 'Ley de Plomo', unidadMedida: '%', valor: '12', estadoMedicion: 'VALIDADO' },
          ],
        },
        {
          id: '2',
          numeroLote: 'LT-2',
          cantidadSacos: 20,
          pesoNeto: '1000',
          unidadPeso: 'KG',
          tipoMineral: 'Complejo Zn-Ag',
          leyes: [
            { codigoLey: 'ZN_PCT', mineral: 'Zinc', simbolo: 'Zn', nombreLey: 'Ley de Zinc', unidadMedida: '%', valor: '45', estadoMedicion: 'VALIDADO' },
            { codigoLey: 'PB_PCT', mineral: 'Plomo', simbolo: 'Pb', nombreLey: 'Ley de Plomo', unidadMedida: '%', valor: null, estadoMedicion: 'NO_MEDIDO' },
          ],
        },
      ];

      const res = calcularResumenLotes(lotes);
      const pb = res.promediosLeyes.find((p) => p.codigoLey === 'PB_PCT')!;
      expect(pb.leyPromedioRedondeada).toBe('12.00'); // No promedia con 0 (que daría 6.00)
      expect(pb.lotesIncluidos).toBe(1);
      expect(pb.lotesConFaltante).toBe(1);
      expect(pb.coberturaPct).toBe('50.00');
      expect(pb.advertenciaFaltantes).toBe(true);
    });

    it('Prueba 6: Comprueba fórmula Peso Neto Húmedo = Peso Bruto − Tara y Peso Seco = Húmedo × (1 − Humedad%/100)', () => {
      const neto = calcularPesoNetoHumedo('1545.50', '45.50');
      expect(neto.toFixed(2)).toBe('1500.00');

      const seco = calcularPesoSecoDesdeHumedad(neto, '5.00'); // 5% de humedad sobre 1.500 kg = 1.425 kg secos
      expect(seco.toFixed(2)).toBe('1425.00');
    });
  });

  // =========================================================================
  // PRUEBAS ESPECÍFICAS 2 y 7 — CREACIÓN Y VENTA DE 40 LOTES + HISTORIAL
  // =========================================================================
  describe('Pruebas 2 y 7 — Creación de 40 Lotes, Cierre de Venta y Expediente Histórico', () => {
    let ids40Lotes: string[] = [];
    let ventaIdCreada = '';

    it('Registra 40 lotes nuevos con pesaje Bruto/Tara/Humedad y cierra una venta actualizando el stock', async () => {
      const provRes = await app.inject({
        method: 'GET',
        url: '/api/proveedores',
        headers: { authorization: `Bearer ${tokenAlmacenero}` },
      });
      const proveedores = provRes.json().proveedores;

      const catRes = await app.inject({
        method: 'GET',
        url: '/api/catalogo-leyes',
        headers: { authorization: `Bearer ${tokenAlmacenero}` },
      });
      const catalogo = catRes.json().catalogoLeyes;
      const leyZn = catalogo.find((c: any) => c.codigo === 'ZN_PCT');
      const leyAg = catalogo.find((c: any) => c.codigo === 'AG_GT');

      for (let c = 0; c < 4; c++) {
        const prov = proveedores[c % proveedores.length];
        const lotesBatch = Array.from({ length: 10 }).map((_, idx) => {
          const n = c * 10 + idx + 1;
          return {
            numeroLote: `LT-V2TEST-${String(n).padStart(3, '0')}`,
            minaOrigen: prov.minaOrigen,
            cantidadSacos: 25,
            pesoBrutoHumedo: 1030 + n * 20,
            pesoTara: 30,
            pesoNeto: 1000 + n * 20,
            humedadPct: 4.0,
            unidadPeso: 'KG',
            tipoMineral: 'Complejo Zn-Ag',
            leyes: [
              { catalogoLeyId: leyZn.id, valor: 40 + (n % 10) },
              { catalogoLeyId: leyAg.id, valor: 220 + n * 4 },
            ],
          };
        });

        const createRes = await app.inject({
          method: 'POST',
          url: '/api/compras',
          headers: { authorization: `Bearer ${tokenAlmacenero}` },
          payload: {
            fecha: '2026-11-15',
            proveedorId: prov.id,
            expedienteM02: `M02-TEST-${c + 1}`,
            lotes: lotesBatch,
          },
        });
        expect(createRes.statusCode).toBe(201);
        ids40Lotes.push(...createRes.json().lotes.map((l: any) => l.id));
      }

      expect(ids40Lotes).toHaveLength(40);

      const compRes = await app.inject({
        method: 'GET',
        url: '/api/compradores',
        headers: { authorization: `Bearer ${tokenVendedor}` },
      });
      const comprador = compRes.json().compradores[0];

      const ventaRes = await app.inject({
        method: 'POST',
        url: '/api/ventas',
        headers: { authorization: `Bearer ${tokenVendedor}` },
        payload: {
          fecha: '2026-11-15',
          compradorId: comprador.id,
          loteIds: ids40Lotes,
          expedienteM02: 'M02-VTA-TEST40',
          observaciones: 'Venta de 40 lotes verificada en suite v2.0',
        },
      });

      expect(ventaRes.statusCode).toBe(201);
      const venta = ventaRes.json().venta;
      ventaIdCreada = venta.id;
      expect(venta.totalLotes).toBe(40);
      expect(venta.detalles).toHaveLength(40);
    });

    it('Verifica el expediente histórico reproducible y bloqueo de edición de ensayes en lotes vendidos', async () => {
      const histRes = await app.inject({
        method: 'GET',
        url: `/api/ventas/${ventaIdCreada}`,
        headers: { authorization: `Bearer ${tokenVendedor}` },
      });
      expect(histRes.statusCode).toBe(200);
      expect(histRes.json().venta.detalles).toHaveLength(40);

      // Intentar modificar el ensaye de laboratorio de un lote ya vendido debe devolver 409
      const loteVendidoDetalle = await app.inject({
        method: 'GET',
        url: `/api/lotes/${ids40Lotes[0]}`,
        headers: { authorization: `Bearer ${tokenLaboratorio}` },
      });
      const ensayeId = loteVendidoDetalle.json().lote.leyes[0].id;

      const intentoLab = await app.inject({
        method: 'PUT',
        url: `/api/laboratorio/ensayes/${ensayeId}`,
        headers: { authorization: `Bearer ${tokenLaboratorio}` },
        payload: {
          valor: 55.0,
          tipoEnsaye: 'DIRIMENCIA',
          estadoMedicion: 'VALIDADO',
          laboratorio: 'Lab Externo',
          nroCertificado: 'CERT-999',
          motivoCambio: 'Intento sobre lote vendido',
        },
      });
      expect(intentoLab.statusCode).toBe(409);
    });
  });

  // =========================================================================
  // PRUEBA ESPECÍFICA 8 — CONCURRENCIA SIMULTÁNEA E IDEMPOTENCIA
  // =========================================================================
  describe('Prueba 8 — Concurrencia de Dos Ventas Simultáneas e Idempotencia con Idempotency Key', () => {
    it('Ejecuta dos ventas concurrentes sobre un mismo lote (solo una se completa) y verifica que repetir la misma idempotencyKey no duplica la venta', async () => {
      const dispRes = await app.inject({
        method: 'GET',
        url: '/api/lotes?estado=DISPONIBLE',
        headers: { authorization: `Bearer ${tokenVendedor}` },
      });
      const lotesDisp = dispRes.json().lotes;
      const loteConcurrencia = lotesDisp[0];
      const loteIdempotencia = lotesDisp[1];

      const compRes = await app.inject({
        method: 'GET',
        url: '/api/compradores',
        headers: { authorization: `Bearer ${tokenVendedor}` },
      });
      const compradores = compRes.json().compradores;

      // 1. Dos solicitudes simultáneas de distintos usuarios sobre el mismo lote
      const [resA, resB] = await Promise.all([
        app.inject({
          method: 'POST',
          url: '/api/ventas',
          headers: { authorization: `Bearer ${tokenVendedor}` },
          payload: {
            fecha: '2026-11-15',
            compradorId: compradores[0].id,
            loteIds: [loteConcurrencia.id],
          },
        }),
        app.inject({
          method: 'POST',
          url: '/api/ventas',
          headers: { authorization: `Bearer ${tokenAdmin}` },
          payload: {
            fecha: '2026-11-15',
            compradorId: compradores[1].id,
            loteIds: [loteConcurrencia.id],
          },
        }),
      ]);

      expect([resA.statusCode, resB.statusCode].sort()).toEqual([201, 409]);

      // 2. Doble solicitud con la misma idempotencyKey
      const llaveUnica = 'IDEMP-KEY-TEST-2026-UNICA';
      const req1 = await app.inject({
        method: 'POST',
        url: '/api/ventas',
        headers: {
          authorization: `Bearer ${tokenVendedor}`,
          'x-idempotency-key': llaveUnica,
        },
        payload: {
          idempotencyKey: llaveUnica,
          fecha: '2026-11-15',
          compradorId: compradores[0].id,
          loteIds: [loteIdempotencia.id],
        },
      });
      expect(req1.statusCode).toBe(201);
      const numeroVentaOriginal = req1.json().venta.numeroVenta;

      // Repetir la solicitud con la misma idempotencyKey: devuelve 200 con la misma venta sin error ni duplicado
      const req2 = await app.inject({
        method: 'POST',
        url: '/api/ventas',
        headers: {
          authorization: `Bearer ${tokenVendedor}`,
          'x-idempotency-key': llaveUnica,
        },
        payload: {
          idempotencyKey: llaveUnica,
          fecha: '2026-11-15',
          compradorId: compradores[0].id,
          loteIds: [loteIdempotencia.id],
        },
      });
      expect(req2.statusCode).toBe(200);
      expect(req2.json().idempotente).toBe(true);
      expect(req2.json().venta.numeroVenta).toBe(numeroVentaOriginal);
    });
  });

  // =========================================================================
  // PRUEBA ESPECÍFICA 9 — ROLLBACK TRANSACCIONAL Y SEGURIDAD POR ROLES
  // =========================================================================
  describe('Prueba 9 — Rollback ante Conflicto en Grupo y Autorización RBAC en Backend', () => {
    it('Hace rollback completo si 1 de los lotes del grupo ya fue vendido y valida permisos por rol (incluyendo LABORATORIO y CONSULTA)', async () => {
      const todosRes = await app.inject({
        method: 'GET',
        url: '/api/lotes',
        headers: { authorization: `Bearer ${tokenVendedor}` },
      });
      const todos = todosRes.json().lotes;
      const unDisponible = todos.find((l: any) => l.estado === 'DISPONIBLE');
      const unVendido = todos.find((l: any) => l.estado === 'VENDIDO');

      const compRes = await app.inject({
        method: 'GET',
        url: '/api/compradores',
        headers: { authorization: `Bearer ${tokenVendedor}` },
      });
      const comprador = compRes.json().compradores[0];

      // Intentar vender un grupo mixto (1 disponible + 1 vendido)
      const mixtoRes = await app.inject({
        method: 'POST',
        url: '/api/ventas',
        headers: { authorization: `Bearer ${tokenVendedor}` },
        payload: {
          fecha: '2026-11-15',
          compradorId: comprador.id,
          loteIds: [unDisponible.id, unVendido.id],
        },
      });
      expect(mixtoRes.statusCode).toBe(409);

      // Comprobar que el lote disponible NO cambió a VENDIDO (Rollback verificado)
      const checkDisp = await app.inject({
        method: 'GET',
        url: `/api/lotes/${unDisponible.id}`,
        headers: { authorization: `Bearer ${tokenVendedor}` },
      });
      expect(checkDisp.json().lote.estado).toBe('DISPONIBLE');

      // RBAC: LABORATORIO puede versionar un ensaye disponible, pero NO puede cerrar ventas
      const labIntentaVender = await app.inject({
        method: 'POST',
        url: '/api/ventas',
        headers: { authorization: `Bearer ${tokenLaboratorio}` },
        payload: {
          fecha: '2026-11-15',
          compradorId: comprador.id,
          loteIds: [unDisponible.id],
        },
      });
      expect(labIntentaVender.statusCode).toBe(403);

      const ensayeDispId = checkDisp.json().lote.leyes[0].id;
      const labVersiona = await app.inject({
        method: 'PUT',
        url: `/api/laboratorio/ensayes/${ensayeDispId}`,
        headers: { authorization: `Bearer ${tokenLaboratorio}` },
        payload: {
          valor: 45.25,
          tipoEnsaye: 'FINAL',
          estadoMedicion: 'VALIDADO',
          laboratorio: 'Laboratorio Químico MineralFlow — Potosí',
          nroCertificado: 'CERT-LAB-V2',
          motivoCambio: 'Verificación de certificado final por rol LABORATORIO',
        },
      });
      expect(labVersiona.statusCode).toBe(200);
      expect(labVersiona.json().ensaye.versionActual).toBe(2);

      // CONSULTA no puede versionar ensayes ni crear compras
      const consultaIntentaLab = await app.inject({
        method: 'PUT',
        url: `/api/laboratorio/ensayes/${ensayeDispId}`,
        headers: { authorization: `Bearer ${tokenConsulta}` },
        payload: {
          valor: 50,
          tipoEnsaye: 'FINAL',
          estadoMedicion: 'VALIDADO',
          laboratorio: 'Lab',
          nroCertificado: 'C1',
          motivoCambio: 'Intento no autorizado',
        },
      });
      expect(consultaIntentaLab.statusCode).toBe(403);
    });

    it('Prueba 10 — Módulo de Cotizaciones Mineras: Oficial Quincenal, En Vivo, Edición Manual de Oro y Liquidación', async () => {
      // 1. Obtener lista oficial (Zinc 1.73, Estaño 21.53, Oro 4010.22)
      const resCot = await app.inject({
        method: 'GET',
        url: '/api/cotizaciones',
        headers: { authorization: `Bearer ${tokenAdmin}` },
      });
      expect(resCot.statusCode).toBe(200);
      const data = resCot.json();
      expect(data.modo).toBe('OFICIAL');
      expect(data.cotizaciones.length).toBeGreaterThanOrEqual(12);

      const cotOro = data.cotizaciones.find((c: any) => c.id === 'COT-AU-STD');
      expect(cotOro).toBeDefined();
      expect(cotOro.cotizacionUsd).toBe(4010.22);
      expect(cotOro.unidad).toBe('O.T.');

      // 2. Modificar manualmente el valor del oro (ej. 4250.00 $US)
      const resUpdateOro = await app.inject({
        method: 'PUT',
        url: `/api/cotizaciones/${cotOro.id}`,
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: {
          cotizacionUsd: 4250.0,
          alicuotaRegalia: 7.0,
        },
      });
      expect(resUpdateOro.statusCode).toBe(200);
      expect(resUpdateOro.json().cotizacion.cotizacionUsd).toBe(4250.0);
      expect(resUpdateOro.json().modo).toBe('MANUAL');

      // 3. Probar simulación de liquidación para Oro
      const resLiquidar = await app.inject({
        method: 'POST',
        url: '/api/cotizaciones/liquidar-estimacion',
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: {
          cotizacionId: cotOro.id,
          pesoKg: 1000,
          leyValor: 15.5, // 15.5 g/t de Oro
          leyUnidad: 'g/t',
          deduccionMaquilaUsd: 50,
        },
      });
      expect(resLiquidar.statusCode).toBe(200);
      const liq = resLiquidar.json();
      expect(liq.pesoFinoEnUnidad).toBeGreaterThan(0);
      expect(liq.valorBrutoUsd).toBeGreaterThan(0);
      expect(liq.valorNetoUsd).toBeLessThan(liq.valorBrutoUsd);

      // 4. Cambiar a modo EN_VIVO
      const resModo = await app.inject({
        method: 'POST',
        url: '/api/cotizaciones/modo',
        headers: { authorization: `Bearer ${tokenAdmin}` },
        payload: { modo: 'EN_VIVO' },
      });
      expect(resModo.statusCode).toBe(200);
      expect(resModo.json().modo).toBe('EN_VIVO');

      // 5. Restablecer valores oficiales
      const resReset = await app.inject({
        method: 'POST',
        url: '/api/cotizaciones/reset',
        headers: { authorization: `Bearer ${tokenAdmin}` },
      });
      expect(resReset.statusCode).toBe(200);
      expect(resReset.json().modo).toBe('OFICIAL');
    });
  });
});
