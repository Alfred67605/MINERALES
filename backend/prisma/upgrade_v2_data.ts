import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

/**
 * Enriquecimiento NO destructivo para MineralFlow 2.0:
 * Conserva exactamente los 51 lotes (45 DISPONIBLES y 6 VENDIDOS) y sus pesos originales,
 * enriqueciendo las tablas nuevas (minas, ubicaciones_almacen, usuario laboratorio,
 * peso_bruto_humedo, peso_tara, humedad_pct, documentos M-02, versiones de ensaye y kardex).
 */
export async function upgradeDataNonDestructive() {
  console.log('🔧 Ejecutando enriquecimiento no destructivo MineralFlow 2.0...');

  // 1. Limpiar sufijos "(DEMO)" o "(FICTICIO)" excesivos en los nombres de sesión de usuarios existentes
  const usuarios = await prisma.usuario.findMany();
  for (const u of usuarios) {
    const nombreLimpio = u.nombre.replace(/\s*\(DEMO\)/gi, '').trim();
    if (nombreLimpio !== u.nombre) {
      await prisma.usuario.update({
        where: { id: u.id },
        data: { nombre: nombreLimpio },
      });
    }
  }

  // Asegurar que exista el rol LABORATORIO sin borrar usuarios previos
  const existeLab = await prisma.usuario.findUnique({ where: { username: 'laboratorio' } });
  if (!existeLab) {
    const hashDemo = await bcrypt.hash('DemoMineral2026!', 10);
    await prisma.usuario.create({
      data: {
        nombre: 'Ing. Quím. Elena Quispe Condori',
        email: 'laboratorio@mineralflow.bo',
        username: 'laboratorio',
        hashPassword: hashDemo,
        rol: 'LABORATORIO',
        estado: 'ACTIVO',
      },
    });
  }

  // 2. Crear Ubicaciones de Almacén (etiquetadas como conceptuales si no hay plano físico cargado)
  const zonasData = [
    { codigo: 'ZONA-A1', nombre: 'Plataforma Norte — Complejos Zn-Ag', zona: 'Nave A', capacidadKg: 40000, esConceptual: true },
    { codigo: 'ZONA-A2', nombre: 'Plataforma Sur — Polimetálicos Pb-Zn', zona: 'Nave A', capacidadKg: 40000, esConceptual: true },
    { codigo: 'ZONA-B1', nombre: 'Bóveda Central — Concentrados de Estaño', zona: 'Nave B', capacidadKg: 30000, esConceptual: true },
    { codigo: 'ZONA-C1', nombre: 'Patio de Consolidación y Despacho', zona: 'Nave C', capacidadKg: 50000, esConceptual: true },
  ];

  const ubicaciones = [];
  for (const z of zonasData) {
    const ub = await prisma.ubicacionAlmacen.upsert({
      where: { codigo: z.codigo },
      update: { nombre: z.nombre, zona: z.zona },
      create: z,
    });
    ubicaciones.push(ub);
  }

  // 3. Crear catálogo separado de Minas de Procedencia vinculadas a los Proveedores existentes
  const proveedores = await prisma.proveedor.findMany({ orderBy: { codigo: 'asc' } });
  const minasCreadas = [];
  for (let i = 0; i < proveedores.length; i++) {
    const p = proveedores[i];
    const codigoMina = `MINA-00${i + 1}`;
    const nombreMina = p.minaOrigen || `Yacimiento Andino ${i + 1}`;
    const departamento = nombreMina.includes('Oruro') || nombreMina.includes('Huanuni') || nombreMina.includes('Poopó')
      ? 'Oruro'
      : nombreMina.includes('Colquiri')
      ? 'La Paz'
      : 'Potosí';

    await prisma.proveedor.update({
      where: { id: p.id },
      data: {
        nimNiar: `NIM-0${20010 + i}`,
        departamento,
        municipio: nombreMina.split('—')[0]?.trim() || 'Potosí',
      },
    });

    const mina = await prisma.mina.upsert({
      where: { codigo: codigoMina },
      update: { nombre: nombreMina, proveedorId: p.id, departamento },
      create: {
        codigo: codigoMina,
        nombre: nombreMina,
        localidad: nombreMina,
        departamento,
        proveedorId: p.id,
        estado: 'ACTIVO',
      },
    });
    minasCreadas.push(mina);
  }

  // 4. Enriquecer Compras existentes con Boleto de Pesaje y Expediente M-02 (Asistencia Documental Interna)
  const compras = await prisma.compra.findMany({ orderBy: { numeroCompra: 'asc' } });
  for (let i = 0; i < compras.length; i++) {
    const c = compras[i];
    if (!c.expedienteM02) {
      const m02Code = `M02-INT-2026-${String(i + 101).padStart(4, '0')}`;
      const boletoCode = `BP-BAL-2026-${String(i + 501).padStart(4, '0')}`;
      await prisma.compra.update({
        where: { id: c.id },
        data: {
          boletoPesaje: boletoCode,
          guiaRemision: `GR-${String(i + 301).padStart(4, '0')}`,
          expedienteM02: m02Code,
          estadoM02: i % 3 === 0 ? 'VERIFICADO' : 'RECIBIDO',
          nimOperador: `NIM-0200${(i % 6) + 1}0`,
        },
      });

      const docCount = await prisma.documentoCumplimiento.count({ where: { compraId: c.id } });
      if (docCount === 0) {
        await prisma.documentoCumplimiento.create({
          data: {
            tipoDocumento: 'FORMULARIO_M02',
            numeroDocumento: m02Code,
            estado: i % 3 === 0 ? 'VERIFICADO' : 'RECIBIDO',
            nombreArchivo: `${m02Code}_respaldo_interno.pdf`,
            mimeType: 'application/pdf',
            tamanoBytes: 184320,
            compraId: c.id,
            observaciones: 'Registro interno de asistencia documental M-02 (SENARECOM)',
            usuarioNombre: 'Ing. Carlos Mamani Quispe',
          },
        });
      }
    }
  }

  // 5. Enriquecer los 51 lotes existentes SIN tocar su pesoNeto, unidadPeso, cantidadSacos ni estado
  const lotes = await prisma.lote.findMany({
    include: { leyes: true },
    orderBy: { numeroLote: 'asc' },
  });

  for (let i = 0; i < lotes.length; i++) {
    const l = lotes[i];
    const pesoNetoDec = new Decimal(l.pesoNeto.toString());
    const esTm = l.unidadPeso === 'TM';
    // Calcular tara realista para que pesoBrutoHumedo - pesoTara === pesoNeto exactamente
    const taraEnUnidad = esTm
      ? new Decimal(l.cantidadSacos).mul(0.002) // 2 kg por saco expresado en TM
      : new Decimal(l.cantidadSacos).mul(1.5);  // 1.5 kg de tara por saco y paleta
    const brutoEnUnidad = pesoNetoDec.add(taraEnUnidad);
    const humedadPct = new Decimal(3.5 + (i % 5) * 0.8); // Humedad entre 3.5% y 6.7%
    const pesoSecoEnUnidad = pesoNetoDec.mul(new Decimal(1).sub(humedadPct.div(100)));

    const minaAsociada = minasCreadas.find((m) => m.proveedorId === l.proveedorId) || minasCreadas[0];
    const ubicacionAsociada = ubicaciones[i % ubicaciones.length];

    await prisma.lote.update({
      where: { id: l.id },
      data: {
        minaId: l.minaId || minaAsociada?.id || null,
        ubicacionId: l.ubicacionId || ubicacionAsociada.id,
        pesoBrutoHumedo: l.pesoBrutoHumedo ?? brutoEnUnidad.toFixed(4),
        pesoTara: l.pesoTara && Number(l.pesoTara) > 0 ? l.pesoTara : taraEnUnidad.toFixed(4),
        humedadPct: l.humedadPct && Number(l.humedadPct) > 0 ? l.humedadPct : humedadPct.toFixed(2),
        pesoSeco: l.pesoSeco ?? pesoSecoEnUnidad.toFixed(4),
        boletoPesaje: l.boletoPesaje || `BOL-2026-${l.numeroLote.slice(-4)}`,
      },
    });

    // Asegurar versión inicial en ensaye_versiones para trazabilidad de laboratorio
    for (const ley of l.leyes) {
      if (!ley.nroCertificado) {
        await prisma.loteLey.update({
          where: { id: ley.id },
          data: {
            nroCertificado: `CERT-LAB-${l.numeroLote.slice(-4)}`,
            validadoPor: 'Ing. Quím. Elena Quispe Condori',
          },
        });
      }
      const verCount = await prisma.ensayeVersion.count({ where: { loteLeyId: ley.id } });
      if (verCount === 0) {
        await prisma.ensayeVersion.create({
          data: {
            loteLeyId: ley.id,
            version: 1,
            valor: ley.valor,
            tipoEnsaye: 'FINAL',
            estadoMedicion: 'VALIDADO',
            laboratorio: 'Laboratorio Químico MineralFlow — Potosí',
            nroCertificado: `CERT-LAB-${l.numeroLote.slice(-4)}`,
            motivoCambio: 'Emisión de certificado químico inicial de recepción',
            usuarioNombre: 'Ing. Quím. Elena Quispe Condori',
          },
        });
      }
    }

    // Asegurar registro en Kardex de movimientos_inventario
    const movCount = await prisma.movimientoInventario.count({ where: { loteId: l.id } });
    if (movCount === 0) {
      const pesoKg = esTm ? pesoNetoDec.mul(1000) : pesoNetoDec;
      await prisma.movimientoInventario.create({
        data: {
          loteId: l.id,
          tipoMovimiento: 'RECEPCION_COMPRA',
          ubicacionOrigen: l.minaOrigen || 'Mina de Origen',
          ubicacionDestino: ubicacionAsociada.codigo,
          sacosAntes: 0,
          sacosDespues: l.cantidadSacos,
          pesoKgAntes: 0,
          pesoKgDespues: pesoKg.toFixed(4),
          motivo: `Ingreso a almacén (${l.numeroLote})`,
          usuarioNombre: 'Téc. Rubén Choque Condori',
          fechaHora: l.fechaCompra,
        },
      });

      if (l.estado === 'VENDIDO') {
        await prisma.movimientoInventario.create({
          data: {
            loteId: l.id,
            tipoMovimiento: 'SALIDA_VENTA',
            ubicacionOrigen: ubicacionAsociada.codigo,
            ubicacionDestino: 'DESPACHO_COMPRADOR',
            sacosAntes: l.cantidadSacos,
            sacosDespues: 0,
            pesoKgAntes: pesoKg.toFixed(4),
            pesoKgDespues: 0,
            motivo: `Liquidación y despacho de venta cerrada (${l.numeroLote})`,
            usuarioNombre: 'Lic. Valeria Rojas Vargas',
          },
        });
      }
    }
  }

  // 6. Enriquecer Ventas históricas con expediente M-02
  const ventas = await prisma.venta.findMany();
  for (let i = 0; i < ventas.length; i++) {
    const v = ventas[i];
    if (!v.expedienteM02) {
      await prisma.venta.update({
        where: { id: v.id },
        data: {
          expedienteM02: `M02-VTA-2026-00${i + 1}`,
          estadoM02: 'VERIFICADO',
          pesoTotalSecoKg: new Decimal(v.pesoTotalKg.toString()).mul(0.955).toFixed(4),
        },
      });
    }
  }

  console.log('✅ Enriquecimiento no destructivo completado.');
}

const isMain =
  !process.env.VITEST &&
  (process.argv[1]?.endsWith('upgrade_v2_data.ts') || process.argv[1]?.endsWith('upgrade_v2_data.js'));

if (isMain) {
  upgradeDataNonDestructive()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

