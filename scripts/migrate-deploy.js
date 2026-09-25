/**
 * Aplica las migraciones de Prisma al arrancar, sin riesgo de borrar datos.
 *
 * Hasta septiembre de 2026 la base se sincronizaba con `prisma db push --accept-data-loss`,
 * así que la base de producción no tiene historial de migraciones. La primera vez:
 *   - si la base ya tiene tablas y coincide con el esquema, marca `0_init` como aplicada;
 *   - si hay diferencias, no toca nada y arranca igual (hay que revisarlo a mano).
 * Después, solo ejecuta `prisma migrate deploy`, que nunca borra datos por su cuenta.
 */
const { execSync, spawnSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const BASELINE = '0_init';

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

async function main() {
  const prisma = new PrismaClient();
  let hasTables = false;
  let baselineRecorded = false;
  try {
    const [{ user }] = await prisma.$queryRaw`SELECT to_regclass('public."User"') IS NOT NULL AS "user"`;
    const [{ mig }] = await prisma.$queryRaw`SELECT to_regclass('public."_prisma_migrations"') IS NOT NULL AS "mig"`;
    hasTables = user;
    if (mig) {
      const rows = await prisma.$queryRaw`SELECT 1 FROM "_prisma_migrations" WHERE migration_name = ${BASELINE} AND finished_at IS NOT NULL`;
      baselineRecorded = rows.length > 0;
    }
  } finally {
    await prisma.$disconnect();
  }

  if (hasTables && !baselineRecorded) {
    // --exit-code: 0 = sin diferencias, 2 = hay diferencias
    const diff = spawnSync(
      'npx',
      ['prisma', 'migrate', 'diff', '--from-schema-datasource', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'],
      { stdio: 'inherit' }
    );
    if (diff.status !== 0) {
      console.error(`[migraciones] La base no coincide con el esquema (código ${diff.status}). No se aplican migraciones; revisar a mano.`);
      return;
    }
    console.log(`[migraciones] Base existente sin historial: se marca ${BASELINE} como aplicada.`);
    run(`npx prisma migrate resolve --applied ${BASELINE}`);
  }

  run('npx prisma migrate deploy');
}

// Si algo falla, se registra y la app arranca igual con la base tal como está
main().catch((err) => {
  console.error('[migraciones] Error, se arranca sin migrar:', err);
});
