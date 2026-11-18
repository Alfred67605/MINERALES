import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Decimal } from 'decimal.js';
import { calcularResumenLotes, convertirPesoAKg, LoteCalculoInput } from '../src/utils/calculations.js';
import { upgradeDataNonDestructive } from './upgrade_v2_data.js';

const prisma = new PrismaClient();

export async function seedDatabase() {
  console.log('🌱 Iniciando población de datos ficticios de demostración (MineralFlow Bolivia)...');

  // Limpiar en orden respetando integridad referencial
  await prisma.auditoria.deleteMany();
  await prisma.resumenLeyVenta.deleteMany();
  await prisma.detalleVenta.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.loteLey.deleteMany();
  await prisma.lote.deleteMany();
  await prisma.compra.deleteMany();
  await prisma.catalogoLey.deleteMany();
  await prisma.comprador.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.usuario.deleteMany();

  // 1. Usuarios de demostración con contraseñas ficticias hasheadas
  const hashDemo = await bcrypt.hash('DemoMineral2026!', 10);

  const [adminUser, almaceneroUser, vendedorUser, consultaUser] = await Promise.all([
    prisma.usuario.create({
      data: {
        nombre: 'Ing. Carlos Mamani Quispe (DEMO)',
        email: 'admin@mineralflow.demo.bo',
        username: 'admin',
        hashPassword: hashDemo,
        rol: 'ADMINISTRADOR',
        estado: 'ACTIVO',
      },
    }),
    prisma.usuario.create({
      data: {
        nombre: 'Téc. Rubén Choque Condori (DEMO)',
        email: 'almacen@mineralflow.demo.bo',
        username: 'almacenero',
        hashPassword: hashDemo,
        rol: 'ALMACENERO',
        estado: 'ACTIVO',
      },
    }),
    prisma.usuario.create({
      data: {
        nombre: 'Lic. Valeria Rojas Vargas (DEMO)',
        email: 'ventas@mineralflow.demo.bo',
        username: 'vendedor',
        hashPassword: hashDemo,
        rol: 'VENDEDOR',
        estado: 'ACTIVO',
      },
    }),
    prisma.usuario.create({
      data: {
        nombre: 'Aud. Fernando Flores Ticona (DEMO)',
        email: 'consulta@mineralflow.demo.bo',
        username: 'consulta',
        hashPassword: hashDemo,
        rol: 'CONSULTA',
        estado: 'ACTIVO',
      },
    }),
  ]);

  // 2. Catálogo flexible de Leyes Minerales
  const leyesCatalogo = await Promise.all([
    prisma.catalogoLey.create({
      data: {
        codigo: 'ZN_PCT',
        mineral: 'Zinc',
        simbolo: 'Zn',
        nombreLey: 'Ley de Zinc',
        unidadMedida: '%',
        valorMinimo: 0,
        valorMaximo: 85,
        decimales: 2,
      },
    }),
    prisma.catalogoLey.create({
      data: {
        codigo: 'AG_DM',
        mineral: 'Plata',
        simbolo: 'Ag',
        nombreLey: 'Ley de Plata (DM)',
        unidadMedida: 'DM',
        valorMinimo: 0,
        valorMaximo: 500,
        decimales: 2,
      },
    }),
    prisma.catalogoLey.create({
      data: {
        codigo: 'AG_GT',
        mineral: 'Plata',
        simbolo: 'Ag',
        nombreLey: 'Ley de Plata (g/t)',
        unidadMedida: 'g/t',
        valorMinimo: 0,
        valorMaximo: 25000,
        decimales: 1,
      },
    }),
    prisma.catalogoLey.create({
      data: {
        codigo: 'PB_PCT',
        mineral: 'Plomo',
        simbolo: 'Pb',
        nombreLey: 'Ley de Plomo',
        unidadMedida: '%',
        valorMinimo: 0,
        valorMaximo: 85,
        decimales: 2,
      },
    }),
    prisma.catalogoLey.create({
      data: {
        codigo: 'SN_PCT',
        mineral: 'Estaño',
        simbolo: 'Sn',
        nombreLey: 'Ley de Estaño',
        unidadMedida: '%',
        valorMinimo: 0,
        valorMaximo: 80,
        decimales: 2,
      },
    }),
    prisma.catalogoLey.create({
      data: {
        codigo: 'CU_PCT',
        mineral: 'Cobre',
        simbolo: 'Cu',
        nombreLey: 'Ley de Cobre',
        unidadMedida: '%',
        valorMinimo: 0,
        valorMaximo: 75,
        decimales: 2,
      },
    }),
  ]);

  const mapLey = Object.fromEntries(leyesCatalogo.map((l) => [l.codigo, l]));

  // 3. Proveedores ficticios (Cooperativas y Minas de Bolivia)
  const proveedores = await Promise.all([
    prisma.proveedor.create({
      data: {
        codigo: 'PROV-001',
        nombre: 'Cooperativa Minera Cerro Rico Ltda. (FICTICIO)',
        minaOrigen: 'Cerro Rico — Potosí',
        telefono: '+591 2 6224100',
        observaciones: 'Proveedor de complejos de Zinc-Plata de alta ley (Datos ficticios de demostración)',
        estado: 'ACTIVO',
      },
    }),
    prisma.proveedor.create({
      data: {
        codigo: 'PROV-002',
        nombre: 'Cooperativa Minera Huanuni Sur R.L. (FICTICIO)',
        minaOrigen: 'Distrito Huanuni — Oruro',
        telefono: '+591 2 5281920',
        observaciones: 'Suministro regular de concentrados de Estaño y complejos (Datos ficticios)',
        estado: 'ACTIVO',
      },
    }),
    prisma.proveedor.create({
      data: {
        codigo: 'PROV-003',
        nombre: 'Sociedad Minera Colquiri Andina (FICTICIO)',
        minaOrigen: 'Veta Rosario — Colquiri',
        telefono: '+591 2 2441800',
        observaciones: 'Lotes clasificados por tamiz y humedad controlada (Datos ficticios)',
        estado: 'ACTIVO',
      },
    }),
    prisma.proveedor.create({
      data: {
        codigo: 'PROV-004',
        nombre: 'Cooperativa Minera Porco Imperial (FICTICIO)',
        minaOrigen: 'Yacimiento Porco — Potosí',
        telefono: '+591 2 6248310',
        observaciones: 'Complejos polimetálicos Zn-Pb-Ag (Datos ficticios)',
        estado: 'ACTIVO',
      },
    }),
    prisma.proveedor.create({
      data: {
        codigo: 'PROV-005',
        nombre: 'Ingenio Minero Poopó Central (FICTICIO)',
        minaOrigen: 'Cuenca Poopó — Oruro',
        telefono: '+591 2 5254411',
        observaciones: 'Concentrados de flotación verificados en laboratorio (Datos ficticios)',
        estado: 'ACTIVO',
      },
    }),
    prisma.proveedor.create({
      data: {
        codigo: 'PROV-006',
        nombre: 'Asociación Minera San Cristóbal Norte (FICTICIO)',
        minaOrigen: 'Nor Lípez — Potosí',
        telefono: '+591 2 6239900',
        observaciones: 'Lotes de exportación con control granulométrico (Datos ficticios)',
        estado: 'ACTIVO',
      },
    }),
  ]);

  // 4. Compradores ficticios (Comercializadoras y Fundiciones)
  const compradores = await Promise.all([
    prisma.comprador.create({
      data: {
        codigo: 'COMP-001',
        nombre: 'Comercializadora Andina de Metales S.A. (FICTICIO)',
        identificacion: 'NIT 1029384021',
        telefono: '+591 2 2791100',
        direccion: 'Av. Arce N.º 2410, Zona Sopocachi — La Paz',
        observaciones: 'Comprador mayorista de lotes agrupados para exportación vía Arica (Ficticio)',
        estado: 'ACTIVO',
      },
    }),
    prisma.comprador.create({
      data: {
        codigo: 'COMP-002',
        nombre: 'Empresa Metalúrgica Vinto Sur — División Comercial (FICTICIO)',
        identificacion: 'NIT 1004928015',
        telefono: '+591 2 5278010',
        direccion: 'Carretera Vinto Km 7 — Oruro',
        observaciones: 'Comprador de concentrados de Estaño y complejos minerales (Ficticio)',
        estado: 'ACTIVO',
      },
    }),
    prisma.comprador.create({
      data: {
        codigo: 'COMP-003',
        nombre: 'Consorcio Exportador Altiplano Minerals Ltda. (FICTICIO)',
        identificacion: 'NIT 3049182019',
        telefono: '+591 2 6229840',
        direccion: 'Zona Cantumarca, Parque Industrial — Potosí',
        observaciones: 'Despachos consolidados de 20 a 50 lotes (Ficticio)',
        estado: 'ACTIVO',
      },
    }),
  ]);

  // 5. Registrar Compras históricas y 45 Lotes DISPONIBLES + 6 Lotes VENDIDOS (Total 51 lotes)
  // Primero creamos 6 lotes históricos que ya fueron vendidos en 2 ventas previas para que el Dashboard y el Historial tengan datos reales desde el inicio.
  const compraHist1 = await prisma.compra.create({
    data: {
      numeroCompra: 'CMP-2026-0001',
      fecha: new Date('2026-10-18T10:00:00Z'),
      proveedorId: proveedores[0].id,
      usuarioId: almaceneroUser.id,
      observaciones: 'Compra histórica liquidada (DEMO)',
    },
  });

  const lotesHistoricosVendidos = [];
  for (let i = 1; i <= 6; i++) {
    const prov = proveedores[i % proveedores.length];
    const sacos = 25 + (i % 4) * 5;
    const peso = 1250 + i * 180;
    const znVal = new Decimal(42 + i * 1.4).toFixed(2);
    const agVal = new Decimal(180 + i * 22.5).toFixed(1);

    const lote = await prisma.lote.create({
      data: {
        numeroLote: `LT-2026-000${i}`,
        compraId: compraHist1.id,
        proveedorId: prov.id,
        usuarioId: almaceneroUser.id,
        fechaCompra: new Date(`2026-10-${18 + i}T11:30:00Z`),
        minaOrigen: prov.minaOrigen,
        cantidadSacos: sacos,
        pesoNeto: new Decimal(peso).toFixed(4),
        unidadPeso: 'KG',
        tipoMineral: 'Complejo Zn-Ag',
        estado: 'VENDIDO',
        observaciones: `Lote histórico de demostración #${i}`,
        leyes: {
          create: [
            { catalogoLeyId: mapLey['ZN_PCT'].id, valor: znVal },
            { catalogoLeyId: mapLey['AG_GT'].id, valor: agVal },
          ],
        },
      },
      include: {
        proveedor: true,
        leyes: { include: { catalogoLey: true } },
      },
    });
    lotesHistoricosVendidos.push(lote);
  }

  // Crear 2 ventas históricas reales para los primeros 6 lotes (3 lotes cada una)
  const gruposVentaHist = [
    {
      numeroVenta: 'VTA-2026-0001',
      fecha: new Date('2026-10-25T15:20:00Z'),
      comprador: compradores[0],
      lotes: lotesHistoricosVendidos.slice(0, 3),
    },
    {
      numeroVenta: 'VTA-2026-0002',
      fecha: new Date('2026-11-02T16:45:00Z'),
      comprador: compradores[2],
      lotes: lotesHistoricosVendidos.slice(3, 6),
    },
  ];

  for (const gv of gruposVentaHist) {
    const inputs: LoteCalculoInput[] = gv.lotes.map((l) => ({
      id: l.id,
      numeroLote: l.numeroLote,
      cantidadSacos: l.cantidadSacos,
      pesoNeto: l.pesoNeto.toString(),
      unidadPeso: l.unidadPeso,
      tipoMineral: l.tipoMineral,
      leyes: l.leyes.map((ll) => ({
        codigoLey: ll.catalogoLey.codigo,
        mineral: ll.catalogoLey.mineral,
        simbolo: ll.catalogoLey.simbolo,
        nombreLey: ll.catalogoLey.nombreLey,
        unidadMedida: ll.catalogoLey.unidadMedida,
        valor: ll.valor.toString(),
      })),
    }));

    const res = calcularResumenLotes(inputs, false);

    await prisma.venta.create({
      data: {
        numeroVenta: gv.numeroVenta,
        fecha: gv.fecha,
        compradorId: gv.comprador.id,
        usuarioId: vendedorUser.id,
        totalLotes: res.totalLotes,
        totalSacos: res.totalSacos,
        pesoTotalKg: res.pesoTotalKg,
        unidadPeso: 'KG',
        criterioPeso: res.criterioPeso,
        compradorNombreSnapshot: gv.comprador.nombre,
        compradorNitSnapshot: gv.comprador.identificacion,
        estado: 'CONFIRMADA',
        observaciones: 'Despacho histórico consolidado (Datos ficticios de demostración)',
        detalles: {
          create: gv.lotes.map((l) => ({
            loteId: l.id,
            numeroLoteSnapshot: l.numeroLote,
            fechaCompraSnapshot: l.fechaCompra,
            proveedorNombreSnapshot: l.proveedor.nombre,
            minaOrigenSnapshot: l.minaOrigen,
            tipoMineralSnapshot: l.tipoMineral,
            sacosRegistrados: l.cantidadSacos,
            pesoRegistrado: l.pesoNeto,
            unidadPesoRegistrada: l.unidadPeso,
            pesoKgCalculado: convertirPesoAKg(l.pesoNeto.toString(), l.unidadPeso).toFixed(4),
            leyesSnapshot: l.leyes.map((ll) => ({
              codigoLey: ll.catalogoLey.codigo,
              mineral: ll.catalogoLey.mineral,
              simbolo: ll.catalogoLey.simbolo,
              nombreLey: ll.catalogoLey.nombreLey,
              unidadMedida: ll.catalogoLey.unidadMedida,
              valor: Number(ll.valor),
              valorStr: new Decimal(ll.valor.toString()).toFixed(ll.catalogoLey.decimales),
            })),
          })),
        },
        resumenLeyes: {
          create: res.promediosLeyes.map((pl) => ({
            codigoLey: pl.codigoLey,
            mineral: pl.mineral,
            simbolo: pl.simbolo,
            nombreLey: pl.nombreLey,
            unidadMedida: pl.unidadMedida,
            leyPromedio: pl.leyPromedio,
            pesoBasePonderadoKg: pl.pesoBasePonderadoKg,
            lotesIncluidos: pl.lotesIncluidos,
            lotesConFaltante: pl.lotesConFaltante,
            criterioPonderacion: res.criterioPeso,
          })),
        },
      },
    });
  }

  // Ahora creamos 45 Lotes DISPONIBLES distribuidos en 9 compras recientes para permitir seleccionar rápidamente 10, 20 o 40+ lotes
  let loteCounter = 101;
  for (let cIdx = 0; cIdx < 9; cIdx++) {
    const prov = proveedores[cIdx % proveedores.length];
    const fechaCompra = new Date(Date.UTC(2026, 10, 4 + cIdx, 13, 0, 0));
    const compra = await prisma.compra.create({
      data: {
        numeroCompra: `CMP-2026-${String(cIdx + 2).padStart(4, '0')}`,
        fecha: fechaCompra,
        proveedorId: prov.id,
        usuarioId: almaceneroUser.id,
        observaciones: `Recepción en almacén de ${prov.nombre} (DEMO)`,
      },
    });

    // 5 lotes por compra = 45 lotes DISPONIBLES
    for (let j = 0; j < 5; j++) {
      const idx = cIdx * 5 + j;
      const numeroLote = `LT-2026-${String(loteCounter++).padStart(4, '0')}`;
      const sacos = 18 + ((idx * 3) % 24); // Entre 18 y 41 sacos

      // Incluir tanto lotes en KG como algunos en TM para demostrar conversión automática compatible
      const usaToneladas = idx % 9 === 8;
      const pesoKgBase = 950 + ((idx * 135) % 2100); // Entre 950 kg y 3.050 kg
      const pesoNeto = usaToneladas
        ? new Decimal(pesoKgBase).div(1000).toFixed(4)
        : new Decimal(pesoKgBase).toFixed(4);
      const unidadPeso = usaToneladas ? 'TM' : 'KG';

      // Alternar entre tipos minerales realistas manteniendo la mayoría en Complejo Zn-Ag-Pb para selección masiva homogénea
      const esEstano = idx >= 40; // Los últimos 5 lotes son Concentrado de Estaño, y los primeros 40 lotes (LT-2026-0101 a LT-2026-0140) son Complejo Zn-Ag-Pb
      const tipoMineral = esEstano ? 'Concentrado de Estaño (Sn)' : 'Complejo Zn-Ag-Pb';

      const leyesCrear = esEstano
        ? [
            {
              catalogoLeyId: mapLey['SN_PCT'].id,
              valor: new Decimal(52.4 + (idx % 12) * 1.15).toFixed(4),
            },
            {
              catalogoLeyId: mapLey['AG_DM'].id,
              valor: new Decimal(18.5 + (idx % 7) * 2.3).toFixed(4),
            },
          ]
        : [
            {
              catalogoLeyId: mapLey['ZN_PCT'].id,
              valor: new Decimal(38.5 + ((idx * 1.35) % 18)).toFixed(4),
            },
            {
              catalogoLeyId: mapLey['AG_GT'].id,
              valor: new Decimal(210 + ((idx * 28.5) % 420)).toFixed(4),
            },
            {
              catalogoLeyId: mapLey['PB_PCT'].id,
              valor: new Decimal(8.2 + ((idx * 0.75) % 9.5)).toFixed(4),
            },
          ];

      await prisma.lote.create({
        data: {
          numeroLote,
          compraId: compra.id,
          proveedorId: prov.id,
          usuarioId: almaceneroUser.id,
          fechaCompra,
          minaOrigen: prov.minaOrigen,
          cantidadSacos: sacos,
          pesoNeto,
          unidadPeso,
          tipoMineral,
          estado: 'DISPONIBLE',
          observaciones: `Lote verificado en balanza camionera — Balanza N.º ${(idx % 2) + 1} (DEMO)`,
          leyes: {
            create: leyesCrear,
          },
        },
      });
    }
  }

  await prisma.auditoria.create({
    data: {
      usuarioId: adminUser.id,
      usuarioNombre: adminUser.nombre,
      accion: 'SEED_INICIAL_DEMO',
      entidad: 'Sistema',
      registroId: 'INIT-DEMO-2026',
      valorNuevo: {
        mensaje: 'Datos ficticios de demostración inicializados: 45 lotes DISPONIBLES y 6 lotes VENDIDOS.',
      },
    },
  });

  await upgradeDataNonDestructive();
  console.log('✅ Base de datos poblada con éxito (45 lotes DISPONIBLES + 6 lotes VENDIDOS).');
}

const isMain =
  !process.env.VITEST &&
  (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js'));
if (isMain) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
