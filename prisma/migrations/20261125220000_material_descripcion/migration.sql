-- Descripción de cada material (ej. "Botella de 1 litro."): sale en gris bajo el nombre en la
-- cotización y en la factura de INTEG, que repite las líneas de la cotización.
ALTER TABLE "ProjectMaterial" ADD COLUMN "descripcion" TEXT;
