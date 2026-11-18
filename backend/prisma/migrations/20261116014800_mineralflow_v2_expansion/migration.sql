-- CreateEnum
CREATE TYPE "TipoEnsaye" AS ENUM ('PROVISIONAL', 'FINAL', 'LABORATORIO_EXTERNO', 'DIRIMENCIA');

-- CreateEnum
CREATE TYPE "EstadoMedicionLey" AS ENUM ('MEDIDO', 'SIN_DATO', 'NO_MEDIDO', 'BAJO_LIMITE_DETECCION', 'CERO_MEDIDO', 'VALIDADO');

-- CreateEnum
CREATE TYPE "EstadoDocumentoNormativo" AS ENUM ('PENDIENTE', 'RECIBIDO', 'VERIFICADO');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstadoLote" ADD VALUE 'BORRADOR';
ALTER TYPE "EstadoLote" ADD VALUE 'PENDIENTE_ANALISIS';
ALTER TYPE "EstadoLote" ADD VALUE 'APROBADO';
ALTER TYPE "EstadoLote" ADD VALUE 'RESERVADO';

-- AlterEnum
ALTER TYPE "RolUsuario" ADD VALUE 'LABORATORIO';

-- AlterTable
ALTER TABLE "auditoria" ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "ip_origen" TEXT;

-- AlterTable
ALTER TABLE "compradores" ADD COLUMN     "nim_comprador" TEXT,
ADD COLUMN     "pais_destino" TEXT DEFAULT 'Bolivia';

-- AlterTable
ALTER TABLE "compras" ADD COLUMN     "boleto_pesaje" TEXT,
ADD COLUMN     "estado_m02" "EstadoDocumentoNormativo" NOT NULL DEFAULT 'RECIBIDO',
ADD COLUMN     "expediente_m02" TEXT,
ADD COLUMN     "guia_remision" TEXT,
ADD COLUMN     "nim_operador" TEXT;

-- AlterTable
ALTER TABLE "detalle_ventas" ADD COLUMN     "humedad_registrada_pct" DECIMAL(6,2),
ADD COLUMN     "peso_seco_registrado" DECIMAL(14,4);

-- AlterTable
ALTER TABLE "lote_leyes" ADD COLUMN     "estado_medicion" "EstadoMedicionLey" NOT NULL DEFAULT 'VALIDADO',
ADD COLUMN     "fecha_ensaye" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "laboratorio" TEXT DEFAULT 'Laboratorio Químico MineralFlow — Potosí',
ADD COLUMN     "metodo_analisis" TEXT DEFAULT 'Volumetría / Absorción Atómica',
ADD COLUMN     "nro_certificado" TEXT,
ADD COLUMN     "tipo_ensaye" "TipoEnsaye" NOT NULL DEFAULT 'FINAL',
ADD COLUMN     "validado_por" TEXT,
ADD COLUMN     "version_actual" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "lotes" ADD COLUMN     "boleto_pesaje" TEXT,
ADD COLUMN     "metodo_humedad" TEXT DEFAULT 'ISO 10251',
ADD COLUMN     "metodo_muestreo" TEXT DEFAULT 'ISO 12743',
ADD COLUMN     "mina_id" TEXT,
ADD COLUMN     "peso_bruto_humedo" DECIMAL(14,4),
ADD COLUMN     "peso_tara" DECIMAL(14,4) DEFAULT 0,
ADD COLUMN     "ubicacion_id" TEXT,
ALTER COLUMN "humedad_pct" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "proveedores" ADD COLUMN     "departamento" TEXT DEFAULT 'Potosí',
ADD COLUMN     "municipio" TEXT,
ADD COLUMN     "nim_niar" TEXT;

-- AlterTable
ALTER TABLE "resumen_leyes_venta" ADD COLUMN     "cobertura_pct" DECIMAL(6,2) NOT NULL DEFAULT 100,
ADD COLUMN     "contenido_fino" DECIMAL(14,4),
ADD COLUMN     "unidad_fino" TEXT;

-- AlterTable
ALTER TABLE "ventas" ADD COLUMN     "estado_m02" "EstadoDocumentoNormativo" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "expediente_m02" TEXT,
ADD COLUMN     "expediente_m03" TEXT,
ADD COLUMN     "idempotency_key" TEXT,
ADD COLUMN     "moneda_referencia" TEXT DEFAULT 'BOB',
ADD COLUMN     "motivo_anulacion" TEXT,
ADD COLUMN     "peso_total_seco_kg" DECIMAL(14,4);

-- CreateTable
CREATE TABLE "minas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "departamento" TEXT NOT NULL DEFAULT 'Potosí',
    "proveedor_id" TEXT,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "minas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicaciones_almacen" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "capacidad_kg" DECIMAL(14,4) NOT NULL DEFAULT 50000,
    "es_conceptual" BOOLEAN NOT NULL DEFAULT true,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ubicaciones_almacen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ensaye_versiones" (
    "id" TEXT NOT NULL,
    "lote_ley_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "valor" DECIMAL(14,4) NOT NULL,
    "tipo_ensaye" "TipoEnsaye" NOT NULL,
    "estado_medicion" "EstadoMedicionLey" NOT NULL,
    "laboratorio" TEXT,
    "nro_certificado" TEXT,
    "motivo_cambio" TEXT,
    "usuario_nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ensaye_versiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "lote_id" TEXT NOT NULL,
    "tipo_movimiento" TEXT NOT NULL,
    "ubicacion_origen" TEXT,
    "ubicacion_destino" TEXT,
    "sacos_antes" INTEGER NOT NULL,
    "sacos_despues" INTEGER NOT NULL,
    "peso_kg_antes" DECIMAL(14,4) NOT NULL,
    "peso_kg_despues" DECIMAL(14,4) NOT NULL,
    "motivo" TEXT,
    "usuario_nombre" TEXT NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_cumplimiento" (
    "id" TEXT NOT NULL,
    "tipo_documento" TEXT NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "estado" "EstadoDocumentoNormativo" NOT NULL DEFAULT 'RECIBIDO',
    "nombre_archivo" TEXT,
    "mime_type" TEXT,
    "tamano_bytes" INTEGER,
    "hash_integridad" TEXT,
    "compra_id" TEXT,
    "lote_id" TEXT,
    "venta_id" TEXT,
    "observaciones" TEXT,
    "usuario_nombre" TEXT NOT NULL,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_cumplimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "minas_codigo_key" ON "minas"("codigo");

-- CreateIndex
CREATE INDEX "minas_proveedor_id_idx" ON "minas"("proveedor_id");

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_almacen_codigo_key" ON "ubicaciones_almacen"("codigo");

-- CreateIndex
CREATE INDEX "ensaye_versiones_lote_ley_id_idx" ON "ensaye_versiones"("lote_ley_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_lote_id_idx" ON "movimientos_inventario"("lote_id");

-- CreateIndex
CREATE INDEX "movimientos_inventario_fecha_hora_idx" ON "movimientos_inventario"("fecha_hora");

-- CreateIndex
CREATE INDEX "documentos_cumplimiento_tipo_documento_idx" ON "documentos_cumplimiento"("tipo_documento");

-- CreateIndex
CREATE INDEX "documentos_cumplimiento_lote_id_idx" ON "documentos_cumplimiento"("lote_id");

-- CreateIndex
CREATE INDEX "documentos_cumplimiento_venta_id_idx" ON "documentos_cumplimiento"("venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_idempotency_key_key" ON "ventas"("idempotency_key");

-- AddForeignKey
ALTER TABLE "minas" ADD CONSTRAINT "minas_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_mina_id_fkey" FOREIGN KEY ("mina_id") REFERENCES "minas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones_almacen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ensaye_versiones" ADD CONSTRAINT "ensaye_versiones_lote_ley_id_fkey" FOREIGN KEY ("lote_ley_id") REFERENCES "lote_leyes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_cumplimiento" ADD CONSTRAINT "documentos_cumplimiento_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_cumplimiento" ADD CONSTRAINT "documentos_cumplimiento_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_cumplimiento" ADD CONSTRAINT "documentos_cumplimiento_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

