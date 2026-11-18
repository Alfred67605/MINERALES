import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { prisma, registrarAuditoria } from '../db.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import {
  calcularResumenLotes,
  convertirPesoAKg,
  calcularPesoSecoDesdeHumedad,
  LoteCalculoInput,
} from '../utils/calculations.js';

const confirmarVentaSchema = z.object({
  numeroVenta: z.string().optional(),
  idempotencyKey: z.string().optional().nullable(),
  fecha: z.string().min(4, 'La fecha de la venta es obligatoria'),
  compradorId: z.string().min(1, 'Debe seleccionar un comprador válido'),
  loteIds: z.array(z.string().min(1)).min(1, 'Debe seleccionar al menos un lote para la venta'),
  expedienteM02: z.string().optional().nullable(),
  estadoM02: z.enum(['PENDIENTE', 'RECIBIDO', 'VERIFICADO']).optional(),
  expedienteM03: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  usarPesoSeco: z.boolean().optional().default(false),
});

export function serializarVenta(venta: any) {
  return {
    id: venta.id,
    numeroVenta: venta.numeroVenta,
    idempotencyKey: venta.idempotencyKey || null,
    fecha: venta.fecha,
    compradorId: venta.compradorId,
    compradorNombre: venta.compradorNombreSnapshot || venta.comprador?.nombre || '',
    compradorNit: venta.compradorNitSnapshot || venta.comprador?.identificacion || '',
    compradorCodigo: venta.comprador?.codigo || '',
    usuarioId: venta.usuarioId,
    usuarioNombre: venta.usuario?.nombre || '',
    totalLotes: venta.totalLotes,
    totalSacos: venta.totalSacos,
    pesoTotalKg: Number(new Decimal(venta.pesoTotalKg.toString()).toFixed(4)),
    pesoTotalKgStr: new Decimal(venta.pesoTotalKg.toString()).toFixed(2),
    pesoTotalTmStr: new Decimal(venta.pesoTotalKg.toString()).div(1000).toFixed(4),
    pesoTotalSecoKg: venta.pesoTotalSecoKg
      ? Number(new Decimal(venta.pesoTotalSecoKg.toString()).toFixed(4))
      : Number(new Decimal(venta.pesoTotalKg.toString()).toFixed(4)),
    unidadPeso: venta.unidadPeso,
    criterioPeso: venta.criterioPeso,
    expedienteM02: venta.expedienteM02 || '',
    estadoM02: venta.estadoM02 || 'VERIFICADO',
    expedienteM03: venta.expedienteM03 || '',
    estado: venta.estado,
    observaciones: venta.observaciones || '',
    createdAt: venta.createdAt,
    documentos: venta.documentos || [],
    resumenLeyes: (venta.resumenLeyes || []).map((rl: any) => ({
      id: rl.id,
      codigoLey: rl.codigoLey,
      mineral: rl.mineral,
      simbolo: rl.simbolo,
      nombreLey: rl.nombreLey,
      unidadMedida: rl.unidadMedida,
      leyPromedio: Number(new Decimal(rl.leyPromedio.toString()).toFixed(4)),
      leyPromedioStr: new Decimal(rl.leyPromedio.toString()).toFixed(2),
      pesoBasePonderadoKg: Number(new Decimal(rl.pesoBasePonderadoKg.toString()).toFixed(4)),
      contenidoFino: rl.contenidoFino ? Number(new Decimal(rl.contenidoFino.toString()).toFixed(2)) : 0,
      unidadFino: rl.unidadFino || '',
      lotesIncluidos: rl.lotesIncluidos,
      lotesConFaltante: rl.lotesConFaltante,
      coberturaPct: rl.coberturaPct ? Number(new Decimal(rl.coberturaPct.toString()).toFixed(2)) : 100,
      criterioPonderacion: rl.criterioPonderacion,
    })),
    detalles: (venta.detalles || []).map((det: any) => ({
      id: det.id,
      loteId: det.loteId,
      numeroLote: det.numeroLoteSnapshot,
      fechaCompra: det.fechaCompraSnapshot,
      proveedorNombre: det.proveedorNombreSnapshot,
      minaOrigen: det.minaOrigenSnapshot || '',
      tipoMineral: det.tipoMineralSnapshot,
      sacosRegistrados: det.sacosRegistrados,
      pesoRegistrado: Number(new Decimal(det.pesoRegistrado.toString()).toFixed(4)),
      pesoRegistradoStr: new Decimal(det.pesoRegistrado.toString()).toFixed(2),
      pesoSecoRegistrado: det.pesoSecoRegistrado
        ? Number(new Decimal(det.pesoSecoRegistrado.toString()).toFixed(4))
        : null,
      humedadRegistradaPct: det.humedadRegistradaPct
        ? Number(new Decimal(det.humedadRegistradaPct.toString()).toFixed(2))
        : 0,
      unidadPesoRegistrada: det.unidadPesoRegistrada,
      pesoKgCalculado: Number(new Decimal(det.pesoKgCalculado.toString()).toFixed(4)),
      leyesSnapshot: det.leyesSnapshot,
      estadoLoteActual: det.lote?.estado || 'VENDIDO',
    })),
  };
}

export async function ventasRoutes(app: FastifyInstance) {
  app.get('/api/ventas', { preHandler: [authenticate] }, async (request, reply) => {
    const { compradorId, desde, hasta, q, numeroLote } = request.query as {
      compradorId?: string;
      desde?: string;
      hasta?: string;
      q?: string;
      numeroLote?: string;
    };

    const where: any = {};

    if (compradorId) where.compradorId = compradorId;

    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) {
        const h = new Date(hasta);
        h.setHours(23, 59, 59, 999);
        where.fecha.lte = h;
      }
    }

    if (numeroLote && numeroLote.trim()) {
      where.detalles = {
        some: {
          numeroLoteSnapshot: { contains: numeroLote.trim(), mode: 'insensitive' },
        },
      };
    }

    if (q && q.trim()) {
      where.OR = [
        { numeroVenta: { contains: q.trim(), mode: 'insensitive' } },
        { expedienteM02: { contains: q.trim(), mode: 'insensitive' } },
        { compradorNombreSnapshot: { contains: q.trim(), mode: 'insensitive' } },
        { detalles: { some: { numeroLoteSnapshot: { contains: q.trim(), mode: 'insensitive' } } } },
        { detalles: { some: { proveedorNombreSnapshot: { contains: q.trim(), mode: 'insensitive' } } } },
      ];
    }

    const ventas = await prisma.venta.findMany({
      where,
      include: {
        comprador: true,
        usuario: { select: { id: true, nombre: true, rol: true } },
        documentos: true,
        resumenLeyes: { orderBy: { codigoLey: 'asc' } },
        detalles: {
          include: {
            lote: { select: { id: true, estado: true } },
          },
          orderBy: { numeroLoteSnapshot: 'asc' },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    return reply.send({
      ventas: ventas.map(serializarVenta),
    });
  });

  app.get('/api/ventas/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const venta = await prisma.venta.findUnique({
      where: { id },
      include: {
        comprador: true,
        usuario: { select: { id: true, nombre: true, rol: true } },
        documentos: true,
        resumenLeyes: { orderBy: { codigoLey: 'asc' } },
        detalles: {
          include: {
            lote: {
              include: {
                compra: true,
                proveedor: true,
              },
            },
          },
          orderBy: { numeroLoteSnapshot: 'asc' },
        },
      },
    });

    if (!venta) {
      return reply.status(404).send({
        error: 'Venta no encontrada',
        mensaje: 'La operación de venta solicitada no existe.',
      });
    }

    return reply.send({
      venta: serializarVenta(venta),
    });
  });

  // Confirmar y cerrar una venta mediante transacción ACID atómica + Idempotencia (Módulo 6)
  app.post(
    '/api/ventas',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'VENDEDOR')] },
    async (request, reply) => {
      const parsed = confirmarVentaSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validación fallida',
          mensaje: parsed.error.issues[0]?.message || 'Verifique los datos de la venta.',
        });
      }

      const {
        numeroVenta,
        idempotencyKey,
        fecha,
        compradorId,
        loteIds,
        expedienteM02,
        estadoM02,
        expedienteM03,
        observaciones,
        usarPesoSeco,
      } = parsed.data;

      const headerIdempotency =
        (request.headers['x-idempotency-key'] as string | undefined) || idempotencyKey || null;

      // 0. Verificar Idempotencia si se proporcionó llave idempotente
      if (headerIdempotency) {
        const ventaPrevia = await prisma.venta.findUnique({
          where: { idempotencyKey: headerIdempotency },
          include: {
            comprador: true,
            usuario: { select: { id: true, nombre: true, rol: true } },
            documentos: true,
            resumenLeyes: { orderBy: { codigoLey: 'asc' } },
            detalles: {
              include: { lote: { select: { id: true, estado: true } } },
              orderBy: { numeroLoteSnapshot: 'asc' },
            },
          },
        });

        if (ventaPrevia) {
          return reply.status(200).send({
            idempotente: true,
            mensaje: `Operación idempotente recuperada: La venta ${ventaPrevia.numeroVenta} ya fue registrada previamente con esta llave.`,
            venta: serializarVenta(ventaPrevia),
          });
        }
      }

      // 1. Impedir lotes repetidos dentro de la misma operación
      const uniqueIds = new Set(loteIds);
      if (uniqueIds.size !== loteIds.length) {
        return reply.status(400).send({
          error: 'Lotes duplicados en la operación',
          mensaje: 'La lista de lotes seleccionados contiene identificadores repetidos. No se permiten lotes duplicados.',
        });
      }

      // 2. Verificar que el comprador existe y está activo
      const comprador = await prisma.comprador.findUnique({ where: { id: compradorId } });
      if (!comprador || comprador.estado !== 'ACTIVO') {
        return reply.status(400).send({
          error: 'Comprador inválido',
          mensaje: 'El comprador seleccionado no existe o está inactivo.',
        });
      }

      try {
        const ventaCreada = await prisma.$transaction(
          async (tx) => {
            const lotesEnDb = await tx.lote.findMany({
              where: { id: { in: loteIds } },
              include: {
                proveedor: true,
                ubicacion: true,
                leyes: { include: { catalogoLey: true } },
                detalleVenta: true,
              },
              orderBy: { numeroLote: 'asc' },
            });

            if (lotesEnDb.length !== loteIds.length) {
              throw {
                statusCode: 404,
                error: 'Lotes inexistentes',
                mensaje: `Se solicitaron ${loteIds.length} lotes, pero solo se encontraron ${lotesEnDb.length} en la base de datos.`,
              };
            }

            const lotesNoDisponibles = lotesEnDb.filter(
              (l) => l.estado !== 'DISPONIBLE' || l.detalleVenta !== null
            );

            if (lotesNoDisponibles.length > 0) {
              throw {
                statusCode: 409,
                error: 'Conflicto de disponibilidad de lotes',
                mensaje: `No se puede completar la venta porque ${lotesNoDisponibles.length} lote(s) ya fueron vendidos o no están disponibles: ${lotesNoDisponibles
                  .map((l) => l.numeroLote)
                  .join(', ')}. La transacción completa ha sido cancelada.`,
                lotesEnConflicto: lotesNoDisponibles.map((l) => l.numeroLote),
              };
            }

            const updateResult = await tx.lote.updateMany({
              where: {
                id: { in: loteIds },
                estado: 'DISPONIBLE',
              },
              data: {
                estado: 'VENDIDO',
              },
            });

            if (updateResult.count !== loteIds.length) {
              throw {
                statusCode: 409,
                error: 'Conflicto de concurrencia detectado',
                mensaje:
                  'Otro usuario acaba de vender o modificar uno o más de los lotes seleccionados de forma simultánea. Por seguridad, no se realizó ninguna venta parcial.',
              };
            }

            const inputsCalculo: LoteCalculoInput[] = lotesEnDb.map((l) => ({
              id: l.id,
              numeroLote: l.numeroLote,
              cantidadSacos: l.cantidadSacos,
              pesoBrutoHumedo: l.pesoBrutoHumedo?.toString() || null,
              pesoTara: l.pesoTara?.toString() || null,
              pesoNeto: l.pesoNeto.toString(),
              pesoSeco: l.pesoSeco?.toString() || null,
              humedadPct: l.humedadPct?.toString() || null,
              unidadPeso: l.unidadPeso,
              tipoMineral: l.tipoMineral,
              leyes: l.leyes.map((ll) => ({
                codigoLey: ll.catalogoLey.codigo,
                mineral: ll.catalogoLey.mineral,
                simbolo: ll.catalogoLey.simbolo,
                nombreLey: ll.catalogoLey.nombreLey,
                unidadMedida: ll.catalogoLey.unidadMedida,
                valor: ll.valor.toString(),
                estadoMedicion: ll.estadoMedicion,
              })),
            }));

            const calculoVerificado = calcularResumenLotes(inputsCalculo, Boolean(usarPesoSeco));

            if (!calculoVerificado.esValido) {
              throw {
                statusCode: 400,
                error: 'Error en validación de pesos o leyes',
                mensaje: calculoVerificado.errores.join(' '),
              };
            }

            const countVentas = await tx.venta.count();
            const numeroVentaFinal =
              numeroVenta?.trim().toUpperCase() ||
              `VTA-${new Date().getFullYear()}-${String(countVentas + 1).padStart(4, '0')}`;
            const m02VentaFinal =
              expedienteM02?.trim() ||
              `M02-VTA-${new Date().getFullYear()}-${String(countVentas + 1).padStart(4, '0')}`;

            const venta = await tx.venta.create({
              data: {
                numeroVenta: numeroVentaFinal,
                idempotencyKey: headerIdempotency,
                fecha: new Date(fecha),
                compradorId: comprador.id,
                usuarioId: request.user.id,
                totalLotes: calculoVerificado.totalLotes,
                totalSacos: calculoVerificado.totalSacos,
                pesoTotalKg: calculoVerificado.pesoTotalKg,
                pesoTotalSecoKg: calculoVerificado.pesoTotalSecoKg,
                unidadPeso: 'KG',
                criterioPeso: calculoVerificado.criterioPeso,
                compradorNombreSnapshot: comprador.nombre,
                compradorNitSnapshot: comprador.identificacion || null,
                expedienteM02: m02VentaFinal,
                estadoM02: estadoM02 || 'VERIFICADO',
                expedienteM03: expedienteM03?.trim() || null,
                estado: 'CONFIRMADA',
                observaciones: observaciones?.trim() || null,
                detalles: {
                  create: lotesEnDb.map((l) => {
                    const pesoUsado =
                      usarPesoSeco && l.pesoSeco !== null && l.pesoSeco !== undefined
                        ? l.pesoSeco.toString()
                        : l.pesoNeto.toString();
                    const pesoKg = convertirPesoAKg(pesoUsado, l.unidadPeso);
                    const humPct = l.humedadPct ? new Decimal(l.humedadPct.toString()) : new Decimal(0);
                    const pesoSecoSnap = l.pesoSeco
                      ? new Decimal(l.pesoSeco.toString())
                      : calcularPesoSecoDesdeHumedad(l.pesoNeto.toString(), humPct);

                    const leyesSnapshot = l.leyes.map((ll) => ({
                      codigoLey: ll.catalogoLey.codigo,
                      mineral: ll.catalogoLey.mineral,
                      simbolo: ll.catalogoLey.simbolo,
                      nombreLey: ll.catalogoLey.nombreLey,
                      unidadMedida: ll.catalogoLey.unidadMedida,
                      valor: Number(new Decimal(ll.valor.toString()).toFixed(4)),
                      valorStr: new Decimal(ll.valor.toString()).toFixed(ll.catalogoLey.decimales ?? 2),
                      tipoEnsaye: ll.tipoEnsaye,
                      nroCertificado: ll.nroCertificado,
                    }));

                    return {
                      loteId: l.id,
                      numeroLoteSnapshot: l.numeroLote,
                      fechaCompraSnapshot: l.fechaCompra,
                      proveedorNombreSnapshot: l.proveedor.nombre,
                      minaOrigenSnapshot: l.minaOrigen || l.proveedor.minaOrigen || null,
                      tipoMineralSnapshot: l.tipoMineral,
                      sacosRegistrados: l.cantidadSacos,
                      pesoRegistrado: new Decimal(pesoUsado).toFixed(4),
                      pesoSecoRegistrado: pesoSecoSnap.toFixed(4),
                      humedadRegistradaPct: humPct.toFixed(2),
                      unidadPesoRegistrada: l.unidadPeso,
                      pesoKgCalculado: pesoKg.toFixed(4),
                      leyesSnapshot,
                    };
                  }),
                },
                resumenLeyes: {
                  create: calculoVerificado.promediosLeyes.map((pl) => ({
                    codigoLey: pl.codigoLey,
                    mineral: pl.mineral,
                    simbolo: pl.simbolo,
                    nombreLey: pl.nombreLey,
                    unidadMedida: pl.unidadMedida,
                    leyPromedio: pl.leyPromedio,
                    pesoBasePonderadoKg: pl.pesoBasePonderadoKg,
                    contenidoFino: pl.contenidoFino,
                    unidadFino: pl.unidadFino,
                    lotesIncluidos: pl.lotesIncluidos,
                    lotesConFaltante: pl.lotesConFaltante,
                    coberturaPct: pl.coberturaPct,
                    criterioPonderacion: calculoVerificado.criterioPeso,
                  })),
                },
              },
              include: {
                comprador: true,
                usuario: { select: { id: true, nombre: true, rol: true } },
                documentos: true,
                resumenLeyes: { orderBy: { codigoLey: 'asc' } },
                detalles: {
                  include: { lote: { select: { id: true, estado: true } } },
                  orderBy: { numeroLoteSnapshot: 'asc' },
                },
              },
            });

            // Registrar salida en el Kardex de movimientos_inventario por cada lote vendido
            for (const l of lotesEnDb) {
              const pesoKg = convertirPesoAKg(l.pesoNeto.toString(), l.unidadPeso);
              await tx.movimientoInventario.create({
                data: {
                  loteId: l.id,
                  tipoMovimiento: 'SALIDA_VENTA',
                  ubicacionOrigen: l.ubicacion?.codigo || 'ZONA-A1',
                  ubicacionDestino: `VENTA ${venta.numeroVenta} (${comprador.nombre})`,
                  sacosAntes: l.cantidadSacos,
                  sacosDespues: 0,
                  pesoKgAntes: pesoKg.toFixed(4),
                  pesoKgDespues: 0,
                  motivo: `Liquidación de venta ${venta.numeroVenta}`,
                  usuarioNombre: request.user.nombre,
                },
              });
            }

            await tx.documentoCumplimiento.create({
              data: {
                tipoDocumento: 'FORMULARIO_M02',
                numeroDocumento: m02VentaFinal,
                estado: estadoM02 || 'VERIFICADO',
                nombreArchivo: `${m02VentaFinal}_liquidacion.pdf`,
                mimeType: 'application/pdf',
                tamanoBytes: 215040,
                ventaId: venta.id,
                observaciones: 'Asistencia documental interna M-02 de comercialización',
                usuarioNombre: request.user.nombre,
              },
            });

            await registrarAuditoria({
              tx,
              usuarioId: request.user.id,
              usuarioNombre: request.user.nombre,
              accion: 'CONFIRMAR_VENTA',
              entidad: 'Venta',
              registroId: venta.id,
              valorNuevo: {
                numeroVenta: venta.numeroVenta,
                idempotencyKey: headerIdempotency,
                comprador: comprador.nombre,
                totalLotes: venta.totalLotes,
                totalSacos: venta.totalSacos,
                pesoTotalKg: venta.pesoTotalKg.toString(),
                lotesVendidos: lotesEnDb.map((l) => l.numeroLote),
              },
            });

            return venta;
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          }
        );

        return reply.status(201).send({
          mensaje: `Venta ${ventaCreada.numeroVenta} confirmada exitosamente con ${ventaCreada.totalLotes} lotes.`,
          venta: serializarVenta(ventaCreada),
        });
      } catch (err: any) {
        if (err?.statusCode) {
          return reply.status(err.statusCode).send({
            error: err.error,
            mensaje: err.mensaje,
            lotesEnConflicto: err.lotesEnConflicto,
          });
        }

        if (err?.code === 'P2002' && headerIdempotency) {
          const ventaExistente = await prisma.venta.findUnique({
            where: { idempotencyKey: headerIdempotency },
            include: {
              comprador: true,
              usuario: { select: { id: true, nombre: true, rol: true } },
              documentos: true,
              resumenLeyes: { orderBy: { codigoLey: 'asc' } },
              detalles: {
                include: { lote: { select: { id: true, estado: true } } },
                orderBy: { numeroLoteSnapshot: 'asc' },
              },
            },
          });
          if (ventaExistente) {
            return reply.status(200).send({
              idempotente: true,
              mensaje: `Operación idempotente: La venta ${ventaExistente.numeroVenta} ya fue registrada.`,
              venta: serializarVenta(ventaExistente),
            });
          }
        }

        if (err?.code === 'P2034' || err?.code === 'P2002') {
          return reply.status(409).send({
            error: 'Conflicto de concurrencia o doble venta',
            mensaje:
              'Uno o más de los lotes seleccionados ya fueron incluidos en otra venta simultánea. Operación revertida para proteger la integridad del inventario.',
          });
        }

        request.log.error(err);
        return reply.status(500).send({
          error: 'Error al procesar la venta',
          mensaje: 'Ocurrió un error inesperado y la transacción fue revertida por completo.',
        });
      }
    }
  );
}
