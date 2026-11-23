#!/bin/sh

echo "=========================================================="
echo "🚀 INICIANDO KOYOSIAT S.R.L. EN DOKPLOY"
echo "=========================================================="

# Si no hay DATABASE_URL pero sí hay variables individuales (DB_HOST, etc.), construirla automáticamente
if [ -z "$DATABASE_URL" ] && [ -n "$DB_HOST" ]; then
  DB_USER="${DB_USERNAME:-postgres}"
  DB_PASS="${DB_PASSWORD:-}"
  DB_PORT_VAL="${DB_PORT:-5432}"
  DB_NAME="${DB_DATABASE:-koyosiat_db}"
  DB_PASS_ENC=$(echo "$DB_PASS" | sed 's/#/%23/g')
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASS_ENC}@${DB_HOST}:${DB_PORT_VAL}/${DB_NAME}?schema=public"
  export DATABASE_URL
  echo "📡 DATABASE_URL construida automáticamente desde variables DB_HOST/DB_DATABASE."
fi

# Auto-sanitizar `#` en contraseñas de DATABASE_URL si no está codificado como %23
if [ -n "$DATABASE_URL" ]; then
  case "$DATABASE_URL" in
    *#@*)
      echo "🔧 Codificando automáticamente '#' en DATABASE_URL a '%23'..."
      DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/#@/%23@/g')
      export DATABASE_URL
      ;;
  esac
  case "$DATABASE_URL" in
    *schema=*)
      ;;
    *)
      if echo "$DATABASE_URL" | grep -q '?'; then
        DATABASE_URL="${DATABASE_URL}&schema=public"
      else
        DATABASE_URL="${DATABASE_URL}?schema=public"
      fi
      export DATABASE_URL
      ;;
  esac
fi

# 1. Verificar si DATABASE_URL está configurada
if [ -n "$DATABASE_URL" ]; then
  echo "📡 DATABASE_URL detectada. Sincronizando con PostgreSQL..."
  
  # Reintentar conexión hasta 15 veces (espera a que PostgreSQL esté 100% listo)
  MAX_INTENTOS=15
  INTENTO=1
  while [ $INTENTO -le $MAX_INTENTOS ]; do
    echo "🔄 Intento $INTENTO/$MAX_INTENTOS: conectando a la base de datos..."
    if npx prisma db push --skip-generate; then
      echo "✅ Base de datos sincronizada con éxito!"
      break
    fi
    echo "⏳ Esperando 3 segundos a que la base de datos responda..."
    sleep 3
    INTENTO=$((INTENTO + 1))
  done

  # Poblar con datos de inicio si RUN_SEED está activo
  if [ "$RUN_SEED" = "true" ]; then
    echo "🌱 Ejecutando seed de datos iniciales..."
    npx tsx prisma/seed.ts || echo "⚠️ Seed completado previamente o con advertencia."
  fi
else
  echo "⚠️ ADVERTENCIA: La variable DATABASE_URL está vacía en las variables de entorno de Dokploy."
  echo "⚠️ Configura DATABASE_URL en la pestaña Environment de Dokploy para conectar a PostgreSQL."
fi

# 2. Iniciar servidor Fastify (atiende en 0.0.0.0 en el puerto configurado)
PUERTO="${PORT:-3001}"
echo "=========================================================="
echo "✨ Servidor listo escuchando en puerto: $PUERTO"
echo "=========================================================="

exec npx tsx src/server.ts
