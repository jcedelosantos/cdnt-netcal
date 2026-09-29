-- Datos: en central telefónica los switches también son Grandstream (misma línea que la central y los teléfonos).
-- Hasta 6 extensiones: GWN7801P de 8 puertos; más: GWN7803P de 24 puertos.
UPDATE "EstimadorMaterial" m
SET "referenciaNombre" = 'Grandstream Switch 24 puertos PoE L2+ 4 SFP 400W (GWN7803P)'
FROM "EstimadorConfig" c
WHERE m."configId" = c."id" AND c."area" = 'telefonia' AND m."materialNombre" = 'Switch PoE 24 puertos'
  AND EXISTS (SELECT 1 FROM "PrecioReferencia" p WHERE p."userId" = c."userId" AND p."nombre" = 'Grandstream Switch 24 puertos PoE L2+ 4 SFP 400W (GWN7803P)');

INSERT INTO "EstimadorMaterial" ("id", "configId", "materialNombre", "referenciaNombre", "incluir")
SELECT 'mattsw' || substr(md5(random()::text), 1, 19), c."id", 'Switch PoE 8 puertos', 'Grandstream Switch 8 puertos PoE L2+ 2 SFP 150W (GWN7801P)', true
FROM "EstimadorConfig" c
WHERE c."area" = 'telefonia'
ON CONFLICT ("configId", "materialNombre") DO NOTHING;
