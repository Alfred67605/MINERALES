import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Decimal } from 'decimal.js';
import { prisma, registrarAuditoria } from '../db.js';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import {
  calcularResumenLotes,
  convertirPesoAKg,
  calcularPesoNetoHumedo,
  calcularPesoSecoDesdeHumedad,
  LoteCalculoInput,
} from '../utils/calculations.js';

const leyItemSchema = z.object({
  catalogoLeyId: z.string().min(1, 'Seleccione el tipo de ley mineral'),
  valor: z.union([z.number(), z.string()]).refine((val) => {
    try {
      const d = new Decimal(val);
      return d.gte(0);
    } catch {
      return false;
    }
  }, 'El valor de la ley debe ser un número positivo válido'),
  tipoEnsaye: z.enum(['PROVISIONAL', 'FINAL', 'LABORATORIO_EXTERNO', 'DIRIMENCIA']).optional(),
  estadoMedicion: z
    .enum(['MEDIDO', 'SIN_DATO', 'NO_MEDIDO', 'BAJO_LIMITE_DETECCION', 'CERO_MEDIDO', 'VALIDADO'])
    .optional(),
  laboratorio: z.string().optional().nullable(),
  nroCertificado: z.string().optional().nullable(),
});

const loteInputSchema = z.object({
  numeroLote: z.string().min(2, 'El número de lote es obligatorio'),
  minaId: z.string().optional().nullable(),
  minaOrigen: z.string().optional().nullable(),
  ubicacionId: z.string().optional().nullable(),
  cantidadSacos: z.number().int().positive('La cantidad de sacos debe ser un entero mayor a 0'),
  pesoBrutoHumedo: z.union([z.number(), z.string()]).optional().nullable(),
  pesoTara: z.union([z.number(), z.string()]).optional().nullable(),
  pesoNeto: z.union([z.number(), z.string()]).refine((val) => {
    try {
      return new Decimal(val).gt(0);
    } catch {
      return false;
    }
  }, 'El peso neto debe ser mayor a 0'),
  pesoSeco: z.union([z.number(), z.string()]).optional().nullable(),
  humedadPct: z.union([z.number(), z.string()]).optional().nullable(),
  boletoPesaje: z.string().optional().nullable(),
  unidadPeso: z.enum(['KG', 'TM']).default('KG'),
  tipoMineral: z.string().min(2, 'Indique el tipo de mineral o material'),
  estado: z
    .enum(['BORRADOR', 'PENDIENTE_ANALISIS', 'APROBADO', 'RESERVADO', 'DISPONIBLE'])
    .optional()
    .default('DISPONIBLE'),
  observaciones: z.string().optional().nullable(),
  leyes: z.array(leyItemSchema).min(1, 'Cada lote debe registrar al menos una ley mineral'),
});

const crearCompraSchema = z.object({
  numeroCompra: z.string().optional(),
  fecha: z.string().min(4, 'La fecha de compra es obligatoria'),
  proveedorId: z.string().min(1, 'Seleccione un proveedor válido'),
  boletoPesaje: z.string().optional().nullable(),
  guiaRemision: z.string().optional().nullable(),
  expedienteM02: z.string().optional().nullable(),
  estadoM02: z.enum(['PENDIENTE', 'RECIBIDO', 'VERIFICADO']).optional(),
  nimOperador: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  lotes: z.array(loteInputSchema).min(1, 'Debe incluir al menos un lote en la compra'),
});

const editarLoteSchema = z.object({
  numeroLote: z.string().min(2).optional(),
  minaOrigen: z.string().optional().nullable(),
  ubicacionId: z.string().optional().nullable(),
  cantidadSacos: z.number().int().positive().optional(),
  pesoBrutoHumedo: z.union([z.number(), z.string()]).optional().nullable(),
  pesoTara: z.union([z.number(), z.string()]).optional().nullable(),
  pesoNeto: z.union([z.number(), z.string()]).optional(),
  pesoSeco: z.union([z.number(), z.string()]).optional().nullable(),
  humedadPct: z.union([z.number(), z.string()]).optional().nullable(),
  unidadPeso: z.enum(['KG', 'TM']).optional(),
  tipoMineral: z.string().min(2).optional(),
  observaciones: z.string().optional().nullable(),
  leyes: z.array(leyItemSchema).min(1).optional(),
});

export function serializarLote(lote: any) {
  const pesoKg = convertirPesoAKg(lote.pesoNeto.toString(), lote.unidadPeso);
  const humPct = lote.humedadPct ? Number(new Decimal(lote.humedadPct.toString()).toFixed(2)) : 0;
  const pesoSecoRaw = lote.pesoSeco
    ? new Decimal(lote.pesoSeco.toString())
    : calcularPesoSecoDesdeHumedad(lote.pesoNeto.toString(), humPct);
  const pesoSecoKg = convertirPesoAKg(pesoSecoRaw, lote.unidadPeso);

  return {
    id: lote.id,
    numeroLote: lote.numeroLote,
    compraId: lote.compraId,
    numeroCompra: lote.compra?.numeroCompra || null,
    expedienteM02Compra: lote.compra?.expedienteM02 || null,
    estadoM02Compra: lote.compra?.estadoM02 || 'RECIBIDO',
    proveedorId: lote.proveedorId,
    proveedorNombre: lote.proveedor?.nombre || '',
    proveedorCodigo: lote.proveedor?.codigo || '',
    proveedorNim: lote.proveedor?.nimNiar || '',
    minaId: lote.minaId || null,
    minaOrigen: lote.mina?.nombre || lote.minaOrigen || lote.proveedor?.minaOrigen || '',
    ubicacionId: lote.ubicacionId || null,
    ubicacionCodigo: lote.ubicacion?.codigo || 'ZONA-A1',
    ubicacionNombre: lote.ubicacion?.nombre || 'Plataforma General',
    ubicacionEsConceptual: lote.ubicacion?.esConceptual ?? true,
    usuarioId: lote.usuarioId,
    usuarioNombre: lote.usuario?.nombre || '',
    fechaCompra: lote.fechaCompra,
    cantidadSacos: lote.cantidadSacos,
    pesoBrutoHumedo: lote.pesoBrutoHumedo
      ? Number(new Decimal(lote.pesoBrutoHumedo.toString()).toFixed(4))
      : Number(new Decimal(lote.pesoNeto.toString()).toFixed(4)),
    pesoTara: lote.pesoTara ? Number(new Decimal(lote.pesoTara.toString()).toFixed(4)) : 0,
    pesoNeto: Number(new Decimal(lote.pesoNeto.toString()).toFixed(4)),
    pesoNetoStr: new Decimal(lote.pesoNeto.toString()).toFixed(2),
    humedadPct: humPct,
    pesoSeco: Number(pesoSecoRaw.toFixed(4)),
    pesoSecoStr: pesoSecoRaw.toFixed(2),
    pesoKgEquivalente: Number(pesoKg.toFixed(4)),
    pesoSecoKgEquivalente: Number(pesoSecoKg.toFixed(4)),
    boletoPesaje: lote.boletoPesaje || lote.compra?.boletoPesaje || '',
    metodoHumedad: lote.metodoHumedad || 'ISO 10251',
    metodoMuestreo: lote.metodoMuestreo || 'ISO 12743',
    unidadPeso: lote.unidadPeso,
    tipoMineral: lote.tipoMineral,
    estado: lote.estado,
    observaciones: lote.observaciones || '',
    createdAt: lote.createdAt,
    updatedAt: lote.updatedAt,
    leyes: (lote.leyes || []).map((ll: any) => ({
      id: ll.id,
      catalogoLeyId: ll.catalogoLeyId,
      codigoLey: ll.catalogoLey?.codigo || '',
      mineral: ll.catalogoLey?.mineral || '',
      simbolo: ll.catalogoLey?.simbolo || '',
      nombreLey: ll.catalogoLey?.nombreLey || '',
      unidadMedida: ll.catalogoLey?.unidadMedida || '',
      valor: Number(new Decimal(ll.valor.toString()).toFixed(4)),
      valorStr: new Decimal(ll.valor.toString()).toFixed(ll.catalogoLey?.decimales ?? 2),
      tipoEnsaye: ll.tipoEnsaye || 'FINAL',
      estadoMedicion: ll.estadoMedicion || 'VALIDADO',
      laboratorio: ll.laboratorio || 'Laboratorio Químico MineralFlow — Potosí',
      nroCertificado: ll.nroCertificado || '',
      metodoAnalisis: ll.metodoAnalisis || 'Volumetría / Absorción Atómica',
      versionActual: ll.versionActual || 1,
      validadoPor: ll.validadoPor || '',
      fechaEnsaye: ll.fechaEnsaye,
      versiones: ll.versiones || [],
    })),
    movimientos: lote.movimientos || [],
    documentos: lote.documentos || [],
    detalleVenta: lote.detalleVenta
      ? {
        id: lote.detalleVenta.id,
        ventaId: lote.detalleVenta.ventaId,
        numeroVenta: lote.detalleVenta.venta?.numeroVenta || '',
        fechaVenta: lote.detalleVenta.venta?.fecha || null,
        compradorNombre: lote.detalleVenta.venta?.compradorNombreSnapshot || '',
      }
      : null,
  };
}

export async function comprasLotesRoutes(app: FastifyInstance) {
  // Listar compras registradas
  app.get('/api/compras', { preHandler: [authenticate] }, async (request, reply) => {
    const { proveedorId, desde, hasta, q } = request.query as {
      proveedorId?: string;
      desde?: string;
      hasta?: string;
      q?: string;
    };

    const where: any = {};
    if (proveedorId) where.proveedorId = proveedorId;
    if (desde || hasta) {
      where.fecha = {};
      if (desde) where.fecha.gte = new Date(desde);
      if (hasta) {
        const h = new Date(hasta);
        h.setHours(23, 59, 59, 999);
        where.fecha.lte = h;
      }
    }
    if (q && q.trim()) {
      where.OR = [
        { numeroCompra: { contains: q.trim(), mode: 'insensitive' } },
        { expedienteM02: { contains: q.trim(), mode: 'insensitive' } },
        { proveedor: { nombre: { contains: q.trim(), mode: 'insensitive' } } },
        { lotes: { some: { numeroLote: { contains: q.trim(), mode: 'insensitive' } } } },
      ];
    }

    const compras = await prisma.compra.findMany({
      where,
      include: {
        proveedor: true,
        usuario: { select: { id: true, nombre: true, rol: true } },
        documentos: true,
        lotes: {
          include: {
            ubicacion: true,
            mina: true,
            leyes: { include: { catalogoLey: true } },
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    return reply.send({
      compras: compras.map((c) => ({
        id: c.id,
        numeroCompra: c.numeroCompra,
        fecha: c.fecha,
        proveedorId: c.proveedorId,
        proveedorNombre: c.proveedor.nombre,
        proveedorCodigo: c.proveedor.codigo,
        minaOrigen: c.proveedor.minaOrigen,
        boletoPesaje: c.boletoPesaje,
        guiaRemision: c.guiaRemision,
        expedienteM02: c.expedienteM02,
        estadoM02: c.estadoM02,
        nimOperador: c.nimOperador,
        usuarioNombre: c.usuario.nombre,
        observaciones: c.observaciones,
        createdAt: c.createdAt,
        totalLotes: c.lotes.length,
        totalSacos: c.lotes.reduce((acc, l) => acc + l.cantidadSacos, 0),
        documentos: c.documentos,
        lotes: c.lotes.map(serializarLote),
      })),
    });
  });

  // Registrar una compra con uno o múltiples lotes (Soporte Bruto, Tara, Humedad, Peso Seco, Documentos M-02)
  app.post(
    '/api/compras',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'ALMACENERO')] },
    async (request, reply) => {
      const parsed = crearCompraSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Validación fallida',
          mensaje: parsed.error.issues[0]?.message || 'Verifique los datos de la compra y sus lotes.',
          detalles: parsed.error.issues,
        });
      }

      const data = parsed.data;

      const proveedor = await prisma.proveedor.findUnique({ where: { id: data.proveedorId } });
      if (!proveedor || proveedor.estado !== 'ACTIVO') {
        return reply.status(400).send({
          error: 'Proveedor inválido',
          mensaje: 'El proveedor seleccionado no existe o se encuentra inactivo.',
        });
      }

      const numerosEnSolicitud = data.lotes.map((l) => l.numeroLote.trim().toUpperCase());
      const setNumeros = new Set(numerosEnSolicitud);
      if (setNumeros.size !== numerosEnSolicitud.length) {
        return reply.status(409).send({
          error: 'Lotes duplicados en la solicitud',
          mensaje: 'Ha ingresado números de lote repetidos dentro de la misma compra.',
        });
      }

      const lotesExistentes = await prisma.lote.findMany({
        where: { numeroLote: { in: numerosEnSolicitud } },
        select: { numeroLote: true },
      });

      if (lotesExistentes.length > 0) {
        return reply.status(409).send({
          error: 'Número de lote duplicado',
          mensaje: `Los siguientes números de lote ya están registrados en el sistema: ${lotesExistentes
            .map((e) => e.numeroLote)
            .join(', ')}`,
        });
      }

      const catalogoMap = new Map(
        (await prisma.catalogoLey.findMany()).map((cat) => [cat.id, cat])
      );

      for (const l of data.lotes) {
        for (const ley of l.leyes) {
          const cat = catalogoMap.get(ley.catalogoLeyId);
          if (!cat) {
            return reply.status(400).send({
              error: 'Ley mineral no reconocida',
              mensaje: `Uno de los análisis del lote ${l.numeroLote} referencia una ley inexistente.`,
            });
          }
          const valDec = new Decimal(ley.valor);
          if (valDec.lt(cat.valorMinimo) || valDec.gt(cat.valorMaximo)) {
            return reply.status(400).send({
              error: 'Valor de ley fuera de rango',
              mensaje: `En el lote ${l.numeroLote}, la ley ${cat.nombreLey} (${valDec.toString()} ${cat.unidadMedida
                }) está fuera del rango permitido (${cat.valorMinimo} - ${cat.valorMaximo}).`,
            });
          }
        }
      }

      const ubicacionDefault = await prisma.ubicacionAlmacen.findFirst({
        orderBy: { codigo: 'asc' },
      });

      const resultado = await prisma.$transaction(async (tx) => {
        const countCompras = await tx.compra.count();
        const numeroCompraFinal =
          data.numeroCompra?.trim().toUpperCase() ||
          `CMP-${new Date().getFullYear()}-${String(countCompras + 1).padStart(4, '0')}`;

        const fechaCompraDate = new Date(data.fecha);
        const m02Final =
          data.expedienteM02?.trim() ||
          `M02-INT-${new Date().getFullYear()}-${String(countCompras + 101).padStart(4, '0')}`;

        const nuevaCompra = await tx.compra.create({
          data: {
            numeroCompra: numeroCompraFinal,
            fecha: fechaCompraDate,
            proveedorId: proveedor.id,
            usuarioId: request.user.id,
            boletoPesaje: data.boletoPesaje?.trim() || `BP-${numeroCompraFinal}`,
            guiaRemision: data.guiaRemision?.trim() || null,
            expedienteM02: m02Final,
            estadoM02: data.estadoM02 || 'RECIBIDO',
            nimOperador: data.nimOperador?.trim() || proveedor.nimNiar || null,
            observaciones: data.observaciones?.trim() || null,
          },
        });

        await tx.documentoCumplimiento.create({
          data: {
            tipoDocumento: 'FORMULARIO_M02',
            numeroDocumento: m02Final,
            estado: data.estadoM02 || 'RECIBIDO',
            nombreArchivo: `${m02Final}_recepcion.pdf`,
            mimeType: 'application/pdf',
            tamanoBytes: 152400,
            compraId: nuevaCompra.id,
            observaciones: 'Asistencia documental interna M-02 registrada en compra',
            usuarioNombre: request.user.nombre,
          },
        });

        const lotesCreados = [];

        for (const loteInput of data.lotes) {
          let pesoNetoDec = new Decimal(loteInput.pesoNeto);
          let pesoTaraDec =
            loteInput.pesoTara !== null && loteInput.pesoTara !== undefined && loteInput.pesoTara !== ''
              ? new Decimal(loteInput.pesoTara)
              : new Decimal(0);
          let pesoBrutoDec =
            loteInput.pesoBrutoHumedo !== null &&
              loteInput.pesoBrutoHumedo !== undefined &&
              loteInput.pesoBrutoHumedo !== ''
              ? new Decimal(loteInput.pesoBrutoHumedo)
              : pesoNetoDec.add(pesoTaraDec);

          // Si se enviaron pesoBrutoHumedo y pesoTara válidos, sincronizar pesoNeto = Bruto - Tara
          if (
            loteInput.pesoBrutoHumedo !== null &&
            loteInput.pesoBrutoHumedo !== undefined &&
            loteInput.pesoBrutoHumedo !== '' &&
            loteInput.pesoTara !== null &&
            loteInput.pesoTara !== undefined &&
            loteInput.pesoTara !== ''
          ) {
            const calculado = calcularPesoNetoHumedo(pesoBrutoDec, pesoTaraDec);
            if (calculado.gt(0)) {
              pesoNetoDec = calculado;
            }
          }

          const humedadDec =
            loteInput.humedadPct !== null &&
              loteInput.humedadPct !== undefined &&
              loteInput.humedadPct !== ''
              ? new Decimal(loteInput.humedadPct)
              : new Decimal(0);

          const pesoSecoDec =
            loteInput.pesoSeco !== null && loteInput.pesoSeco !== undefined && loteInput.pesoSeco !== ''
              ? new Decimal(loteInput.pesoSeco)
              : calcularPesoSecoDesdeHumedad(pesoNetoDec, humedadDec);

          const ubicacionFinalId = loteInput.ubicacionId || ubicacionDefault?.id || null;

          const loteCreado = await tx.lote.create({
            data: {
              numeroLote: loteInput.numeroLote.trim().toUpperCase(),
              compraId: nuevaCompra.id,
              proveedorId: proveedor.id,
              minaId: loteInput.minaId || null,
              ubicacionId: ubicacionFinalId,
              usuarioId: request.user.id,
              fechaCompra: fechaCompraDate,
              minaOrigen: loteInput.minaOrigen?.trim() || proveedor.minaOrigen || null,
              cantidadSacos: loteInput.cantidadSacos,
              pesoBrutoHumedo: pesoBrutoDec.toFixed(4),
              pesoTara: pesoTaraDec.toFixed(4),
              pesoNeto: pesoNetoDec.toFixed(4),
              pesoSeco: pesoSecoDec.toFixed(4),
              humedadPct: humedadDec.toFixed(2),
              boletoPesaje: loteInput.boletoPesaje?.trim() || `BOL-${loteInput.numeroLote.trim().toUpperCase()}`,
              unidadPeso: loteInput.unidadPeso,
              tipoMineral: loteInput.tipoMineral.trim(),
              // Conservar comportamiento compatible de guardar como DISPONIBLE por defecto
              estado: loteInput.estado || 'DISPONIBLE',
              observaciones: loteInput.observaciones?.trim() || null,
              leyes: {
                create: loteInput.leyes.map((ley) => ({
                  catalogoLeyId: ley.catalogoLeyId,
                  valor: new Decimal(ley.valor).toFixed(4),
                  tipoEnsaye: ley.tipoEnsaye || 'FINAL',
                  estadoMedicion: ley.estadoMedicion || 'VALIDADO',
                  laboratorio: ley.laboratorio || 'Laboratorio Químico MineralFlow — Potosí',
                  nroCertificado:
                    ley.nroCertificado || `CERT-${loteInput.numeroLote.trim().toUpperCase()}`,
                  validadoPor: request.user.nombre,
                  versiones: {
                    create: [
                      {
                        version: 1,
                        valor: new Decimal(ley.valor).toFixed(4),
                        tipoEnsaye: ley.tipoEnsaye || 'FINAL',
                        estadoMedicion: ley.estadoMedicion || 'VALIDADO',
                        laboratorio: ley.laboratorio || 'Laboratorio Químico MineralFlow — Potosí',
                        nroCertificado:
                          ley.nroCertificado || `CERT-${loteInput.numeroLote.trim().toUpperCase()}`,
                        motivoCambio: 'Registro inicial en recepción de compra',
                        usuarioNombre: request.user.nombre,
                      },
                    ],
                  },
                })),
              },
            },
            include: {
              proveedor: true,
              compra: true,
              ubicacion: true,
              mina: true,
              usuario: true,
              leyes: { include: { catalogoLey: true, versiones: true } },
            },
          });

          const pesoKgMov = convertirPesoAKg(pesoNetoDec, loteInput.unidadPeso);
          await tx.movimientoInventario.create({
            data: {
              loteId: loteCreado.id,
              tipoMovimiento: 'RECEPCION_COMPRA',
              ubicacionOrigen: loteCreado.minaOrigen || 'Mina de Procedencia',
              ubicacionDestino: loteCreado.ubicacion?.codigo || 'ZONA-A1',
              sacosAntes: 0,
              sacosDespues: loteCreado.cantidadSacos,
              pesoKgAntes: 0,
              pesoKgDespues: pesoKgMov.toFixed(4),
              motivo: `Ingreso por Compra ${nuevaCompra.numeroCompra}`,
              usuarioNombre: request.user.nombre,
            },
          });

          lotesCreados.push(loteCreado);
        }

        await registrarAuditoria({
          tx,
          usuarioId: request.user.id,
          usuarioNombre: request.user.nombre,
          accion: 'REGISTRAR_COMPRA_Y_LOTES',
          entidad: 'Compra',
          registroId: nuevaCompra.id,
          valorNuevo: {
            numeroCompra: nuevaCompra.numeroCompra,
            proveedor: proveedor.nombre,
            expedienteM02: nuevaCompra.expedienteM02,
            cantidadLotes: lotesCreados.length,
            lotes: lotesCreados.map((l) => l.numeroLote),
          },
        });

        return { compra: nuevaCompra, lotes: lotesCreados };
      });

      return reply.status(201).send({
        mensaje: `Compra ${resultado.compra.numeroCompra} registrada con ${resultado.lotes.length} lote(s) en estado DISPONIBLE.`,
        compra: resultado.compra,
        lotes: resultado.lotes.map(serializarLote),
      });
    }
  );

  // ================= CONSULTA Y GESTIÓN DE LOTES (ALMACÉN Y SELECCIÓN) =================
  app.get('/api/lotes', { preHandler: [authenticate] }, async (request, reply) => {
    const {
      estado,
      proveedorId,
      ubicacionId,
      minaOrigen,
      tipoMineral,
      q,
      desde,
      hasta,
      sortBy = 'numeroLote',
      sortOrder = 'asc',
      page,
      pageSize,
    } = request.query as {
      estado?: string;
      proveedorId?: string;
      ubicacionId?: string;
      minaOrigen?: string;
      tipoMineral?: string;
      q?: string;
      desde?: string;
      hasta?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: string;
      pageSize?: string;
    };

    const where: any = {};

    if (
      estado === 'DISPONIBLE' ||
      estado === 'VENDIDO' ||
      estado === 'RESERVADO' ||
      estado === 'PENDIENTE_ANALISIS'
    ) {
      where.estado = estado;
    }

    if (proveedorId) where.proveedorId = proveedorId;
    if (ubicacionId) where.ubicacionId = ubicacionId;

    if (minaOrigen && minaOrigen.trim()) {
      where.minaOrigen = { contains: minaOrigen.trim(), mode: 'insensitive' };
    }

    if (tipoMineral && tipoMineral.trim()) {
      where.tipoMineral = { contains: tipoMineral.trim(), mode: 'insensitive' };
    }

    if (desde || hasta) {
      where.fechaCompra = {};
      if (desde) where.fechaCompra.gte = new Date(desde);
      if (hasta) {
        const h = new Date(hasta);
        h.setHours(23, 59, 59, 999);
        where.fechaCompra.lte = h;
      }
    }

    if (q && q.trim()) {
      where.OR = [
        { numeroLote: { contains: q.trim(), mode: 'insensitive' } },
        { proveedor: { nombre: { contains: q.trim(), mode: 'insensitive' } } },
        { minaOrigen: { contains: q.trim(), mode: 'insensitive' } },
        { tipoMineral: { contains: q.trim(), mode: 'insensitive' } },
        { boletoPesaje: { contains: q.trim(), mode: 'insensitive' } },
        { compra: { numeroCompra: { contains: q.trim(), mode: 'insensitive' } } },
        { compra: { expedienteM02: { contains: q.trim(), mode: 'insensitive' } } },
      ];
    }

    const validSortFields: Record<string, any> = {
      numeroLote: { numeroLote: sortOrder === 'desc' ? 'desc' : 'asc' },
      fechaCompra: { fechaCompra: sortOrder === 'desc' ? 'desc' : 'asc' },
      cantidadSacos: { cantidadSacos: sortOrder === 'desc' ? 'desc' : 'asc' },
      pesoNeto: { pesoNeto: sortOrder === 'desc' ? 'desc' : 'asc' },
      proveedor: { proveedor: { nombre: sortOrder === 'desc' ? 'desc' : 'asc' } },
      estado: { estado: sortOrder === 'desc' ? 'desc' : 'asc' },
    };

    const orderBy = validSortFields[sortBy] || { numeroLote: 'asc' };

    const total = await prisma.lote.count({ where });
    const take = pageSize ? Math.min(Math.max(parseInt(pageSize, 10) || 50, 1), 1000) : undefined;
    const skip = page && take ? (Math.max(parseInt(page, 10) || 1, 1) - 1) * take : undefined;

    const lotes = await prisma.lote.findMany({
      where,
      include: {
        proveedor: true,
        compra: true,
        mina: true,
        ubicacion: true,
        usuario: { select: { id: true, nombre: true } },
        leyes: {
          include: { catalogoLey: true },
          orderBy: { catalogoLey: { codigo: 'asc' } },
        },
        detalleVenta: {
          include: {
            venta: {
              select: { id: true, numeroVenta: true, fecha: true, compradorNombreSnapshot: true },
            },
          },
        },
      },
      orderBy,
      take,
      skip,
    });

    return reply.send({
      total,
      page: page ? parseInt(page, 10) : 1,
      pageSize: take || total,
      lotes: lotes.map(serializarLote),
    });
  });

  // Detalle individual de lote con Kardex, Versiones de Laboratorio, Documentos y Auditoría
  app.get('/api/lotes/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const lote = await prisma.lote.findUnique({
      where: { id },
      include: {
        proveedor: true,
        compra: { include: { documentos: true } },
        mina: true,
        ubicacion: true,
        usuario: { select: { id: true, nombre: true, rol: true } },
        leyes: {
          include: {
            catalogoLey: true,
            versiones: { orderBy: { version: 'desc' } },
          },
        },
        movimientos: { orderBy: { fechaHora: 'desc' } },
        documentos: { orderBy: { createdAt: 'desc' } },
        detalleVenta: {
          include: {
            venta: {
              include: { comprador: true, usuario: { select: { nombre: true } } },
            },
          },
        },
      },
    });

    if (!lote) {
      return reply.status(404).send({ error: 'No encontrado', mensaje: 'El lote solicitado no existe.' });
    }

    const auditoria = await prisma.auditoria.findMany({
      where: { entidad: 'Lote', registroId: id },
      orderBy: { fechaHora: 'desc' },
    });

    return reply.send({
      lote: serializarLote(lote),
      auditoria,
    });
  });

  // Editar un lote DISPONIBLE (Bloqueado para lotes VENDIDOS)
  app.put(
    '/api/lotes/:id',
    { preHandler: [authorizeRoles('ADMINISTRADOR', 'ALMACENERO')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const parsed = editarLoteSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Datos inválidos',
          mensaje: parsed.error.issues[0]?.message,
        });
      }

      const loteExistente = await prisma.lote.findUnique({
        where: { id },
        include: { ubicacion: true, leyes: { include: { catalogoLey: true } } },
      });

      if (!loteExistente) {
        return reply.status(404).send({ error: 'No encontrado', mensaje: 'El lote no existe.' });
      }

      if (loteExistente.estado === 'VENDIDO') {
        return reply.status(409).send({
          error: 'Lote vendido inmutable',
          mensaje: `El lote ${loteExistente.numeroLote} ya fue VENDIDO. Sus cantidades, pesos y leyes originales están bloqueados por integridad histórica.`,
        });
      }

      const data = parsed.data;

      if (data.numeroLote && data.numeroLote.trim().toUpperCase() !== loteExistente.numeroLote) {
        const dup = await prisma.lote.findUnique({
          where: { numeroLote: data.numeroLote.trim().toUpperCase() },
        });
        if (dup) {
          return reply.status(409).send({
            error: 'Número de lote duplicado',
            mensaje: `Ya existe otro lote con el código ${data.numeroLote}.`,
          });
        }
      }

      const loteActualizado = await prisma.$transaction(async (tx) => {
        if (data.leyes && data.leyes.length > 0) {
          await tx.loteLey.deleteMany({ where: { loteId: id } });
          for (const l of data.leyes) {
            await tx.loteLey.create({
              data: {
                loteId: id,
                catalogoLeyId: l.catalogoLeyId,
                valor: new Decimal(l.valor).toFixed(4),
                tipoEnsaye: l.tipoEnsaye || 'FINAL',
                estadoMedicion: l.estadoMedicion || 'VALIDADO',
                laboratorio: l.laboratorio || 'Laboratorio Químico MineralFlow — Potosí',
                nroCertificado: l.nroCertificado || `CERT-${loteExistente.numeroLote}`,
                validadoPor: request.user.nombre,
              },
            });
          }
        }

        const pesoNetoFinal =
          data.pesoNeto !== undefined
            ? new Decimal(data.pesoNeto)
            : new Decimal(loteExistente.pesoNeto.toString());
        const humFinal =
          data.humedadPct !== undefined && data.humedadPct !== null
            ? new Decimal(data.humedadPct)
            : new Decimal(loteExistente.humedadPct?.toString() || '0');
        const pesoSecoFinal = calcularPesoSecoDesdeHumedad(pesoNetoFinal, humFinal);

        const updated = await tx.lote.update({
          where: { id },
          data: {
            numeroLote: data.numeroLote ? data.numeroLote.trim().toUpperCase() : undefined,
            minaOrigen: data.minaOrigen !== undefined ? data.minaOrigen?.trim() || null : undefined,
            ubicacionId: data.ubicacionId !== undefined ? data.ubicacionId : undefined,
            cantidadSacos: data.cantidadSacos,
            pesoBrutoHumedo:
              data.pesoBrutoHumedo !== undefined && data.pesoBrutoHumedo !== null
                ? new Decimal(data.pesoBrutoHumedo).toFixed(4)
                : undefined,
            pesoTara:
              data.pesoTara !== undefined && data.pesoTara !== null
                ? new Decimal(data.pesoTara).toFixed(4)
                : undefined,
            pesoNeto: data.pesoNeto !== undefined ? pesoNetoFinal.toFixed(4) : undefined,
            humedadPct: data.humedadPct !== undefined ? humFinal.toFixed(2) : undefined,
            pesoSeco: pesoSecoFinal.toFixed(4),
            unidadPeso: data.unidadPeso,
            tipoMineral: data.tipoMineral ? data.tipoMineral.trim() : undefined,
            observaciones: data.observaciones !== undefined ? data.observaciones?.trim() || null : undefined,
          },
          include: {
            proveedor: true,
            compra: true,
            ubicacion: true,
            mina: true,
            usuario: true,
            leyes: { include: { catalogoLey: true } },
          },
        });

        await tx.movimientoInventario.create({
          data: {
            loteId: id,
            tipoMovimiento: 'AJUSTE_AUDITADO',
            ubicacionOrigen: loteExistente.ubicacion?.codigo || 'ZONA-A1',
            ubicacionDestino: updated.ubicacion?.codigo || 'ZONA-A1',
            sacosAntes: loteExistente.cantidadSacos,
            sacosDespues: updated.cantidadSacos,
            pesoKgAntes: convertirPesoAKg(loteExistente.pesoNeto.toString(), loteExistente.unidadPeso).toFixed(4),
            pesoKgDespues: convertirPesoAKg(updated.pesoNeto.toString(), updated.unidadPeso).toFixed(4),
            motivo: 'Edición auditada de lote disponible',
            usuarioNombre: request.user.nombre,
          },
        });

        await registrarAuditoria({
          tx,
          usuarioId: request.user.id,
          usuarioNombre: request.user.nombre,
          accion: 'EDITAR_LOTE_DISPONIBLE',
          entidad: 'Lote',
          registroId: id,
          valorAnterior: serializarLote(loteExistente),
          valorNuevo: serializarLote(updated),
        });

        return updated;
      });

      return reply.send({
        mensaje: `Lote ${loteActualizado.numeroLote} actualizado correctamente.`,
        lote: serializarLote(loteActualizado),
      });
    }
  );

  // Endpoint de pre-verificación de cálculos en el servidor (Módulo 5 y 6.6)
  app.post('/api/lotes/calcular', { preHandler: [authenticate] }, async (request, reply) => {
    const body = request.body as { loteIds?: string[]; usarPesoSeco?: boolean };
    if (!body?.loteIds || !Array.isArray(body.loteIds) || body.loteIds.length === 0) {
      return reply.send({
        resumen: calcularResumenLotes([], false),
      });
    }

    const lotes = await prisma.lote.findMany({
      where: { id: { in: body.loteIds } },
      include: {
        leyes: { include: { catalogoLey: true } },
      },
    });

    const inputs: LoteCalculoInput[] = lotes.map((l) => ({
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

    const resumen = calcularResumenLotes(inputs, Boolean(body.usarPesoSeco));
    return reply.send({ resumen });
  });
}
