# Cambios en la base de datos

Desde septiembre de 2026 la base se actualiza con **migraciones** (`prisma migrate deploy`), no con `db push --accept-data-loss`, para no borrar datos por accidente.

Para cambiar el esquema:

1. Edita `prisma/schema.prisma`.
2. Genera la migración contra una base de desarrollo (nunca contra producción):
   ```bash
   DATABASE_URL="postgresql://…base-de-desarrollo…" npx prisma migrate dev --name describe-el-cambio
   ```
3. Revisa el SQL generado en `prisma/migrations/…/migration.sql` (sobre todo si aparece `DROP`).
4. Haz commit del esquema y de la carpeta de la migración y súbelo a `main`. Railway la aplica al arrancar con `scripts/migrate-deploy.js`.
