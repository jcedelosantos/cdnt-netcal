/**
 * Script de migración: SQLite → PostgreSQL
 * Uso: DATABASE_URL=<postgres_url> node scripts/migrate-sqlite-to-postgres.js
 *
 * Requiere que las migraciones ya hayan corrido en Postgres (prisma migrate deploy).
 */

const { PrismaClient: PgClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');

const sqlitePath = path.join(__dirname, '../prisma/dev.db');
const sqlite = new Database(sqlitePath, { readonly: true });
const pg = new PgClient();

function rows(table) {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all();
}

function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  // SQLite stores dates as timestamps (ms) or ISO strings
  if (typeof val === 'number') return new Date(val);
  return new Date(val);
}

async function main() {
  await pg.$connect();
  console.log('Conectado a Postgres. Iniciando migración...\n');

  // Orden de inserción respetando foreign keys
  const tables = [
    'User', 'Account', 'Session', 'VerificationToken',
    'InventoryClient',
    'Project', 'ProjectPoint', 'ProjectMaterial', 'Pago',
    'Tecnico', 'TecnicoRol',
    'ProyectoAsignacion',
    'PeriodoPago', 'DetallePago', 'Anticipo', 'Recibo',
    'Jornada',
    'Alert', 'AlertLog', 'AutomationSchedule',
    'InventoryEquipment', 'InventoryLicense',
    'InventoryMonthlyConsumption', 'InventoryThirdPartySupport',
    'InventoryITProject',
    'TicCategory', 'TicArticle', 'TicInventario',
  ];

  for (const table of tables) {
    const data = rows(table);
    if (data.length === 0) {
      console.log(`  ${table}: vacía, saltando`);
      continue;
    }

    // Convertir fechas (SQLite las guarda como ms o ISO)
    const dateFields = ['fecha', 'createdAt', 'updatedAt', 'fechaInicio', 'fechaFin',
      'aprobadoEn', 'facturadoEn', 'emailVerified', 'expires',
      'fechaCompra', 'fechaRenovacion', 'fechaVencimiento',
      'fechaInstalacion', 'periodStart', 'periodEnd', 'lastRunAt', 'nextRunAt'];

    const converted = data.map(row => {
      const r = { ...row };
      for (const f of dateFields) {
        if (r[f] !== undefined && r[f] !== null) r[f] = toDate(r[f]);
      }
      // Booleans: SQLite usa 0/1, Postgres usa true/false
      for (const [k, v] of Object.entries(r)) {
        if (v === 0 || v === 1) {
          // Solo convertir si es realmente un boolean según el nombre
          const boolNames = ['aprobado','activo','esPersonalizado','modoAvanzado',
            'switchPoE','incluyeUPS','incluyeCotizacion','leido',
            'enabled','switchPoE'];
          if (boolNames.includes(k)) r[k] = v === 1;
        }
      }
      return r;
    });

    try {
      const model = pg[table.charAt(0).toLowerCase() + table.slice(1)];
      if (!model) {
        console.log(`  ${table}: modelo no encontrado en Prisma, saltando`);
        continue;
      }
      await model.createMany({ data: converted, skipDuplicates: true });
      console.log(`  ✓ ${table}: ${converted.length} filas`);
    } catch (err) {
      console.error(`  ✗ ${table}: ${err.message}`);
    }
  }

  console.log('\nMigración completada.');
  await pg.$disconnect();
  sqlite.close();
}

main().catch(async (e) => {
  console.error(e);
  await pg.$disconnect();
  process.exit(1);
});
