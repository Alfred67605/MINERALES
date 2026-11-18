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
