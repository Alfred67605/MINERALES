-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMINISTRADOR', 'ALMACENERO', 'VENDEDOR', 'CONSULTA');

-- CreateEnum
CREATE TYPE "EstadoRegistro" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoLote" AS ENUM ('DISPONIBLE', 'VENDIDO');

-- CreateEnum
CREATE TYPE "UnidadPeso" AS ENUM ('KG', 'TM');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('CONFIRMADA', 'ANULADA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "hash_password" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'ALMACENERO',
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "mina_origen" TEXT,
    "telefono" TEXT,
    "observaciones" TEXT,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compradores" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "identificacion" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "observaciones" TEXT,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_leyes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "mineral" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "nombre_ley" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL,
    "valor_minimo" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "valor_maximo" DECIMAL(14,4) NOT NULL DEFAULT 100,
    "decimales" INTEGER NOT NULL DEFAULT 2,
    "estado" "EstadoRegistro" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogo_leyes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" TEXT NOT NULL,
    "numero_compra" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" TEXT NOT NULL,
    "numero_lote" TEXT NOT NULL,
    "compra_id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "fecha_compra" TIMESTAMP(3) NOT NULL,
    "mina_origen" TEXT,
    "cantidad_sacos" INTEGER NOT NULL,
    "peso_neto" DECIMAL(14,4) NOT NULL,
    "peso_seco" DECIMAL(14,4),
    "humedad_pct" DECIMAL(6,2),
    "unidad_peso" "UnidadPeso" NOT NULL DEFAULT 'KG',
    "tipo_mineral" TEXT NOT NULL,
    "estado" "EstadoLote" NOT NULL DEFAULT 'DISPONIBLE',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lote_leyes" (
    "id" TEXT NOT NULL,
    "lote_id" TEXT NOT NULL,
    "catalogo_ley_id" TEXT NOT NULL,
    "valor" DECIMAL(14,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lote_leyes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "numero_venta" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "comprador_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "total_lotes" INTEGER NOT NULL,
    "total_sacos" INTEGER NOT NULL,
    "peso_total_kg" DECIMAL(14,4) NOT NULL,
    "unidad_peso" "UnidadPeso" NOT NULL DEFAULT 'KG',
    "criterio_peso" TEXT NOT NULL DEFAULT 'PESO_NETO_KG',
    "comprador_nombre_snapshot" TEXT NOT NULL,
    "comprador_nit_snapshot" TEXT,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'CONFIRMADA',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_ventas" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "lote_id" TEXT NOT NULL,
    "numero_lote_snapshot" TEXT NOT NULL,
    "fecha_compra_snapshot" TIMESTAMP(3) NOT NULL,
    "proveedor_nombre_snapshot" TEXT NOT NULL,
    "mina_origen_snapshot" TEXT,
    "tipo_mineral_snapshot" TEXT NOT NULL,
    "sacos_registrados" INTEGER NOT NULL,
    "peso_registrado" DECIMAL(14,4) NOT NULL,
    "unidad_peso_registrada" "UnidadPeso" NOT NULL,
    "peso_kg_calculado" DECIMAL(14,4) NOT NULL,
    "leyes_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalle_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumen_leyes_venta" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "codigo_ley" TEXT NOT NULL,
    "mineral" TEXT NOT NULL,
    "simbolo" TEXT NOT NULL,
    "nombre_ley" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL,
    "ley_promedio" DECIMAL(14,4) NOT NULL,
    "peso_base_ponderado_kg" DECIMAL(14,4) NOT NULL,
    "lotes_incluidos" INTEGER NOT NULL,
    "lotes_con_faltante" INTEGER NOT NULL DEFAULT 0,
    "criterio_ponderacion" TEXT NOT NULL DEFAULT 'PESO_NETO_CONVERTIDO_KG',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumen_leyes_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "usuario_nombre" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "registro_id" TEXT NOT NULL,
    "valor_anterior" JSONB,
    "valor_nuevo" JSONB,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_codigo_key" ON "proveedores"("codigo");

-- CreateIndex
CREATE INDEX "proveedores_estado_idx" ON "proveedores"("estado");

-- CreateIndex
CREATE INDEX "proveedores_nombre_idx" ON "proveedores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "compradores_codigo_key" ON "compradores"("codigo");

-- CreateIndex
CREATE INDEX "compradores_estado_idx" ON "compradores"("estado");

-- CreateIndex
CREATE INDEX "compradores_nombre_idx" ON "compradores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_leyes_codigo_key" ON "catalogo_leyes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "compras_numero_compra_key" ON "compras"("numero_compra");

-- CreateIndex
CREATE INDEX "compras_fecha_idx" ON "compras"("fecha");

-- CreateIndex
CREATE INDEX "compras_proveedor_id_idx" ON "compras"("proveedor_id");

-- CreateIndex
CREATE UNIQUE INDEX "lotes_numero_lote_key" ON "lotes"("numero_lote");

-- CreateIndex
CREATE INDEX "lotes_estado_idx" ON "lotes"("estado");

-- CreateIndex
CREATE INDEX "lotes_fecha_compra_idx" ON "lotes"("fecha_compra");

-- CreateIndex
CREATE INDEX "lotes_proveedor_id_idx" ON "lotes"("proveedor_id");

-- CreateIndex
CREATE INDEX "lotes_tipo_mineral_idx" ON "lotes"("tipo_mineral");

-- CreateIndex
CREATE INDEX "lote_leyes_lote_id_idx" ON "lote_leyes"("lote_id");

-- CreateIndex
CREATE UNIQUE INDEX "lote_leyes_lote_id_catalogo_ley_id_key" ON "lote_leyes"("lote_id", "catalogo_ley_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_numero_venta_key" ON "ventas"("numero_venta");

-- CreateIndex
CREATE INDEX "ventas_fecha_idx" ON "ventas"("fecha");

-- CreateIndex
CREATE INDEX "ventas_comprador_id_idx" ON "ventas"("comprador_id");

-- CreateIndex
CREATE UNIQUE INDEX "detalle_ventas_lote_id_key" ON "detalle_ventas"("lote_id");

-- CreateIndex
CREATE INDEX "detalle_ventas_venta_id_idx" ON "detalle_ventas"("venta_id");

-- CreateIndex
CREATE INDEX "resumen_leyes_venta_venta_id_idx" ON "resumen_leyes_venta"("venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "resumen_leyes_venta_venta_id_codigo_ley_key" ON "resumen_leyes_venta"("venta_id", "codigo_ley");

-- CreateIndex
CREATE INDEX "auditoria_fecha_hora_idx" ON "auditoria"("fecha_hora");

-- CreateIndex
CREATE INDEX "auditoria_entidad_registro_id_idx" ON "auditoria"("entidad", "registro_id");

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_leyes" ADD CONSTRAINT "lote_leyes_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_leyes" ADD CONSTRAINT "lote_leyes_catalogo_ley_id_fkey" FOREIGN KEY ("catalogo_ley_id") REFERENCES "catalogo_leyes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_comprador_id_fkey" FOREIGN KEY ("comprador_id") REFERENCES "compradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ventas" ADD CONSTRAINT "detalle_ventas_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumen_leyes_venta" ADD CONSTRAINT "resumen_leyes_venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
