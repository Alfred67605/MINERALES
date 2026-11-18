import { crearRespaldo, restaurarDesdeArchivo } from '../src/routes/respaldos';
import { prisma } from '../src/db';
import path from 'node:path';

async function main() {
  const antes = await prisma.lote.count();
  const r = await crearRespaldo('prueba');
  console.log('Respaldo:', r.nombre, r.tamano, 'bytes', JSON.stringify(r.resumen));
  const resumen = await restaurarDesdeArchivo(path.resolve('..', 'backups', 'respaldos', r.nombre));
  const despues = await prisma.lote.count();
  const disp = await prisma.lote.count({ where: { estado: 'DISPONIBLE' } });
  console.log('Lotes antes/despues:', antes, despues, 'disponibles:', disp);
  console.log(JSON.stringify(resumen) === JSON.stringify(r.resumen) ? 'ROUNDTRIP OK' : 'DIFERENCIA');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
