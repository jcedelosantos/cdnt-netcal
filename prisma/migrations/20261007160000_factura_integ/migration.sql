-- Facturar desde INTEG: el NCF sale de la secuencia única de Cedanet (ver lib/integ-facturacion.ts).
ALTER TABLE "Project" ADD COLUMN "integFacturaId" INTEGER;
