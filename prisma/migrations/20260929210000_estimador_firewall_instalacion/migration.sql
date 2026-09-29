-- Datos: el estimador de firewall incluye siempre la instalación del equipo como servicio.
-- Costo propuesto RD$5,000 (RD$7,000 con el margen de 40%); editable en Precios de referencia.
INSERT INTO "PrecioReferencia" ("id", "userId", "nombre", "categoria", "suplidor", "marca", "precio", "unidad", "fuente", "fecha", "notas", "createdAt", "updatedAt")
SELECT 'reffwi' || substr(md5(random()::text), 1, 19), t."userId", 'Servicio instalación de firewall', 'Servicio', NULL, NULL, 5000, 'und', 'cotizacion', NOW(),
       'Montaje en rack o pared, conexión a internet y a la red. Valor propuesto, ajustar si hace falta.', NOW(), NOW()
FROM "EstimadorConfig" t
WHERE t."area" = 'firewall'
  AND NOT EXISTS (
    SELECT 1 FROM "PrecioReferencia" p WHERE p."userId" = t."userId" AND lower(p."nombre") = lower('Servicio instalación de firewall')
  );

INSERT INTO "EstimadorMaterial" ("id", "configId", "materialNombre", "referenciaNombre", "incluir")
SELECT 'matfwi' || substr(md5(random()::text), 1, 19), t."id", 'Instalación de firewall', 'Servicio instalación de firewall', true
FROM "EstimadorConfig" t
WHERE t."area" = 'firewall'
ON CONFLICT ("configId", "materialNombre") DO NOTHING;
