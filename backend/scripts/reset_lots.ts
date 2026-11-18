import { prisma } from '../src/db';

async function main() {
  const lotesTest = await prisma.lote.findMany({
    where: { numeroLote: { startsWith: 'LT-2026-01' } },
    select: { id: true, numeroLote: true },
  });

  const ids = lotesTest.map((l) => l.id);

  // Borrar detalles de venta asociados a estos lotes de prueba
  const deletedDetalles = await prisma.detalleVenta.deleteMany({
    where: { loteId: { in: ids } },
  });
  console.log(`Deleted ${deletedDetalles.count} DetalleVenta for test lots.`);

  // Eliminar ventas huérfanas (sin detalle) creadas por pruebas E2E previas
  const huerfanas = await prisma.venta.findMany({
    where: { detalles: { none: {} } },
    select: { id: true },
  });
  const ventaIds = huerfanas.map((v) => v.id);
  if (ventaIds.length) {
    await prisma.resumenLeyVenta.deleteMany({ where: { ventaId: { in: ventaIds } } });
    await prisma.documentoCumplimiento.deleteMany({ where: { ventaId: { in: ventaIds } } });
    await prisma.venta.deleteMany({ where: { id: { in: ventaIds } } });
  }
  console.log(`Deleted ${ventaIds.length} orphan ventas.`);

  // Actualizar estado de los lotes a DISPONIBLE
  const updatedLotes = await prisma.lote.updateMany({
    where: { id: { in: ids } },
    data: { estado: 'DISPONIBLE' },
  });
  console.log(`Reset ${updatedLotes.count} lotes to DISPONIBLE.`);

  const dispCount = await prisma.lote.count({ where: { estado: 'DISPONIBLE' } });
  console.log(`Total DISPONIBLE now: ${dispCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
