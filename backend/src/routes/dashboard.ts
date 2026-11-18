import { FastifyInstance } from 'fastify';
import { Decimal } from 'decimal.js';
import { prisma } from '../db.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { convertirPesoAKg, calcularPesoSecoDesdeHumedad } from '../utils/calculations.js';
import { serializarLote } from './comprasLotes.js';
import { serializarVenta } from './ventas.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/api/dashboard', { preHandler: [authenticate] }, async (_request, reply) => {
    const [todosLosLotes, comprasRecientes, ventasRecientes, todasLasVentas, todasLasCompras] =
      await Promise.all([
        prisma.lote.findMany({
          include: {
            proveedor: { select: { id: true, nombre: true, codigo: true, minaOrigen: true, nimNiar: true } },
            ubicacion: true,
            compra: { select: { id: true, numeroCompra: true, expedienteM02: true, estadoM02: true } },
            leyes: { include: { catalogoLey: true } },
          },
          orderBy: { fechaCompra: 'asc' },
        }),
        prisma.compra.findMany({
          take: 6,
          include: {
            proveedor: true,
            usuario: { select: { id: true, nombre: true } },
            lotes: {
              include: { leyes: { include: { catalogoLey: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.venta.findMany({
          take: 6,
          include: {
            comprador: true,
            usuario: { select: { id: true, nombre: true } },
            resumenLeyes: true,
            detalles: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.venta.findMany({
          include: {
            detalles: true,
          },
          orderBy: { fecha: 'asc' },
        }),
        prisma.compra.findMany({
          select: { id: true, numeroCompra: true, expedienteM02: true, estadoM02: true },
        }),
      ]);

    let lotesDisponibles = 0;
    let lotesVendidos = 0;
    let lotesReservados = 0;
    let sacosDisponibles = 0;
    let sacosVendidos = 0;
    let pesoDisponibleKg = new Decimal(0);
    let pesoSecoDisponibleKg = new Decimal(0);
    let pesoVendidoKg = new Decimal(0);
    let pesoSecoVendidoKg = new Decimal(0);

    const comprasPorFechaMap = new Map<string, { fecha: string; lotes: number; pesoKg: number; sacos: number }>();
    const proveedorDistribucionMap = new Map<
      string,
      { proveedor: string; disponibles: number; vendidos: number; totalLotes: number; pesoDisponibleKg: number }
    >();
    const mineralDistribucionMap = new Map<
      string,
      { mineral: string; lotesDisponibles: number; pesoDisponibleKg: number; pesoSecoKg: number }
    >();

    for (const lote of todosLosLotes) {
      const pesoKg = convertirPesoAKg(lote.pesoNeto.toString(), lote.unidadPeso);
      const humPct = lote.humedadPct ? new Decimal(lote.humedadPct.toString()) : new Decimal(0);
      const pesoSecoRaw = lote.pesoSeco
        ? new Decimal(lote.pesoSeco.toString())
        : calcularPesoSecoDesdeHumedad(lote.pesoNeto.toString(), humPct);
      const pesoSecoKg = convertirPesoAKg(pesoSecoRaw, lote.unidadPeso);

      const fechaStr = lote.fechaCompra.toISOString().slice(0, 10);

      const cf = comprasPorFechaMap.get(fechaStr) || { fecha: fechaStr, lotes: 0, pesoKg: 0, sacos: 0 };
      cf.lotes += 1;
      cf.pesoKg = Number(new Decimal(cf.pesoKg).add(pesoKg).toFixed(2));
      cf.sacos += lote.cantidadSacos;
      comprasPorFechaMap.set(fechaStr, cf);

      const provKey = lote.proveedor.nombre;
      const pd = proveedorDistribucionMap.get(provKey) || {
        proveedor: provKey,
        disponibles: 0,
        vendidos: 0,
        totalLotes: 0,
        pesoDisponibleKg: 0,
      };
      pd.totalLotes += 1;

      if (lote.estado === 'DISPONIBLE') {
        lotesDisponibles += 1;
        sacosDisponibles += lote.cantidadSacos;
        pesoDisponibleKg = pesoDisponibleKg.add(pesoKg);
        pesoSecoDisponibleKg = pesoSecoDisponibleKg.add(pesoSecoKg);
        pd.disponibles += 1;
        pd.pesoDisponibleKg = Number(new Decimal(pd.pesoDisponibleKg).add(pesoKg).toFixed(2));

        const minKey = lote.tipoMineral || 'Otros';
        const md = mineralDistribucionMap.get(minKey) || {
          mineral: minKey,
          lotesDisponibles: 0,
          pesoDisponibleKg: 0,
          pesoSecoKg: 0,
        };
        md.lotesDisponibles += 1;
        md.pesoDisponibleKg = Number(new Decimal(md.pesoDisponibleKg).add(pesoKg).toFixed(2));
        md.pesoSecoKg = Number(new Decimal(md.pesoSecoKg).add(pesoSecoKg).toFixed(2));
        mineralDistribucionMap.set(minKey, md);
      } else if (lote.estado === 'RESERVADO') {
        lotesReservados += 1;
      } else {
        lotesVendidos += 1;
        sacosVendidos += lote.cantidadSacos;
        pesoVendidoKg = pesoVendidoKg.add(pesoKg);
        pesoSecoVendidoKg = pesoSecoVendidoKg.add(pesoSecoKg);
        pd.vendidos += 1;
      }

      proveedorDistribucionMap.set(provKey, pd);
    }

    const ventasPorFechaMap = new Map<string, { fecha: string; ventas: number; lotes: number; pesoKg: number }>();
    for (const v of todasLasVentas) {
      const fStr = v.fecha.toISOString().slice(0, 10);
      const vf = ventasPorFechaMap.get(fStr) || { fecha: fStr, ventas: 0, lotes: 0, pesoKg: 0 };
      vf.ventas += 1;
      vf.lotes += v.totalLotes;
      vf.pesoKg = Number(new Decimal(vf.pesoKg).add(v.pesoTotalKg.toString()).toFixed(2));
      ventasPorFechaMap.set(fStr, vf);
    }

    const todasLasFechasSet = new Set<string>([
      ...Array.from(comprasPorFechaMap.keys()),
      ...Array.from(ventasPorFechaMap.keys()),
    ]);
    const fechasOrdenadas = Array.from(todasLasFechasSet).sort();

    let saldoAcumuladoKg = new Decimal(0);
    const evolucionPesoAlmacen = fechasOrdenadas.map((fecha) => {
      const entradaKg = new Decimal(comprasPorFechaMap.get(fecha)?.pesoKg || 0);
      const salidaKg = new Decimal(ventasPorFechaMap.get(fecha)?.pesoKg || 0);
      saldoAcumuladoKg = saldoAcumuladoKg.add(entradaKg).sub(salidaKg);
      if (saldoAcumuladoKg.lt(0)) saldoAcumuladoKg = new Decimal(0);

      return {
        fecha,
        entradaKg: Number(entradaKg.toFixed(2)),
        salidaKg: Number(salidaKg.toFixed(2)),
        pesoDisponibleKg: Number(saldoAcumuladoKg.toFixed(2)),
      };
    });

    // Alertas operativas accionables basadas en datos reales
    const comprasM02Pendiente = todasLasCompras.filter((c) => c.estadoM02 === 'PENDIENTE').length;
    const lotesSinCertificado = todosLosLotes.filter((l) =>
      l.leyes.some((ll) => !ll.nroCertificado || ll.tipoEnsaye === 'PROVISIONAL')
    ).length;

    const alertasOperativas = [
      {
        id: 'AL-STOCK',
        severidad: 'INFO',
        titulo: `${lotesDisponibles} lotes disponibles listos para consolidación`,
        detalle: `${pesoDisponibleKg.toFixed(2)} kg netos húmedos (${pesoSecoDisponibleKg.toFixed(2)} kg secos estimados) en almacén.`,
        ruta: '/seleccion-venta',
      },
      {
        id: 'AL-M02',
        severidad: comprasM02Pendiente > 0 ? 'ADVERTENCIA' : 'OK',
        titulo:
          comprasM02Pendiente > 0
            ? `${comprasM02Pendiente} recepción(es) con expediente M-02 pendiente`
            : '100% de compras registradas con expediente interno M-02 recibido/verificado',
        detalle: 'Control interno de respaldo documental SENARECOM.',
        ruta: '/trazabilidad',
      },
      {
        id: 'AL-LAB',
        severidad: lotesSinCertificado > 0 ? 'ADVERTENCIA' : 'OK',
        titulo:
          lotesSinCertificado > 0
            ? `${lotesSinCertificado} lote(s) con ensaye provisional pendiente de certificado final`
            : 'Todos los lotes en almacén cuentan con certificado químico validado',
        detalle: 'Trazabilidad mineralógica ISO 12743 / ISO 10251.',
        ruta: '/laboratorio',
      },
    ];

    return reply.send({
      indicadores: {
        totalLotesRegistrados: todosLosLotes.length,
        lotesDisponibles,
        lotesReservados,
        lotesVendidos,
        totalSacosDisponibles: sacosDisponibles,
        totalSacosVendidos: sacosVendidos,
        pesoTotalDisponibleKg: Number(pesoDisponibleKg.toFixed(2)),
        pesoTotalDisponibleTm: Number(pesoDisponibleKg.div(1000).toFixed(3)),
        pesoTotalSecoDisponibleKg: Number(pesoSecoDisponibleKg.toFixed(2)),
        pesoTotalSecoDisponibleTm: Number(pesoSecoDisponibleKg.div(1000).toFixed(3)),
        pesoTotalVendidoKg: Number(pesoVendidoKg.toFixed(2)),
        pesoTotalVendidoTm: Number(pesoVendidoKg.div(1000).toFixed(3)),
        pesoTotalSecoVendidoKg: Number(pesoSecoVendidoKg.toFixed(2)),
        totalComprasOperaciones: todasLasCompras.length,
        totalVentasOperaciones: todasLasVentas.length,
      },
      alertasOperativas,
      graficos: {
        comprasPorFecha: Array.from(comprasPorFechaMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha)),
        ventasPorFecha: Array.from(ventasPorFechaMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha)),
        evolucionPesoAlmacen,
        distribucionPorProveedor: Array.from(proveedorDistribucionMap.values()).sort(
          (a, b) => b.totalLotes - a.totalLotes
        ),
        distribucionPorMineral: Array.from(mineralDistribucionMap.values()),
        proporcionEstados: [
          { estado: 'DISPONIBLE', cantidad: lotesDisponibles, pesoKg: Number(pesoDisponibleKg.toFixed(2)) },
          { estado: 'VENDIDO', cantidad: lotesVendidos, pesoKg: Number(pesoVendidoKg.toFixed(2)) },
        ],
      },
      comprasRecientes: comprasRecientes.map((c) => ({
        id: c.id,
        numeroCompra: c.numeroCompra,
        fecha: c.fecha,
        proveedorNombre: c.proveedor.nombre,
        minaOrigen: c.proveedor.minaOrigen,
        expedienteM02: c.expedienteM02,
        estadoM02: c.estadoM02,
        usuarioNombre: c.usuario.nombre,
        cantidadLotes: c.lotes.length,
        totalSacos: c.lotes.reduce((acc, l) => acc + l.cantidadSacos, 0),
        pesoTotalKg: Number(
          c.lotes
            .reduce((acc, l) => acc.add(convertirPesoAKg(l.pesoNeto.toString(), l.unidadPeso)), new Decimal(0))
            .toFixed(2)
        ),
        lotes: c.lotes.map(serializarLote),
      })),
      ventasRecientes: ventasRecientes.map(serializarVenta),
    });
  });

  app.get(
    '/api/auditoria',
    { preHandler: [authorizeRoles('ADMINISTRADOR')] },
    async (request, reply) => {
      const { entidad, limit = '100' } = request.query as { entidad?: string; limit?: string };
      const where: any = {};
      if (entidad) where.entidad = entidad;

      const registros = await prisma.auditoria.findMany({
        where,
        orderBy: { fechaHora: 'desc' },
        take: Math.min(parseInt(limit, 10) || 100, 500),
      });

      return reply.send({ auditoria: registros });
    }
  );
}
