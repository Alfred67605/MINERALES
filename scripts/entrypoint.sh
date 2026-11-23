#!/bin/sh

echo "=========================================================="
echo "🚀 INICIANDO KOYOSIAT S.R.L. EN DOKPLOY"
echo "=========================================================="

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
