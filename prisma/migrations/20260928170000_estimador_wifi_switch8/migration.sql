-- Datos: switch PoE de 8 puertos para WiFi de hasta 6 access points.
-- Costo de suplidor US$300 sin ITBIS (el real es US$350; se baja para que no cueste más que el de 24 puertos),
-- a RD$63 por dólar. Si ya existe un precio con el mismo nombre, se respeta el existente.
INSERT INTO "PrecioReferencia" ("id", "userId", "nombre", "categoria", "suplidor", "precio", "unidad", "fuente", "fecha", "notas", "createdAt", "updatedAt")
SELECT 'refsw8' || substr(md5(random()::text), 1, 19), t."userId", 'Aruba Instant On switch 8 puertos PoE', 'Redes', 'Solution Box', 18900, 'und', 'cotizacion', NOW(),
       'US$300 sin ITBIS a RD$63 por dólar (el suplidor lo da a US$350; se usa 300 para no superar al de 24 puertos)', NOW(), NOW()
FROM "EstimadorConfig" t
WHERE t."area" = 'wifi'
  AND NOT EXISTS (
    SELECT 1 FROM "PrecioReferencia" p WHERE p."userId" = t."userId" AND lower(p."nombre") = lower('Aruba Instant On switch 8 puertos PoE')
  );

INSERT INTO "EstimadorMaterial" ("id", "configId", "materialNombre", "referenciaNombre", "incluir")
SELECT 'matsw8' || substr(md5(random()::text), 1, 19), t."id", 'Switch PoE 8 puertos', 'Aruba Instant On switch 8 puertos PoE', true
FROM "EstimadorConfig" t
WHERE t."area" = 'wifi'
ON CONFLICT ("configId", "materialNombre") DO NOTHING;
