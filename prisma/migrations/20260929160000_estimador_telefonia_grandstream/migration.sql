-- Datos: el estimador de central telefónica pasa a usar los costos de la lista Grandstream de Solution Box
-- (sep. 2026) en lugar de los precios derivados de la cotización de Reverse de 2024.
-- El teléfono de recepción pasa del GXP1630 (no está en la lista) al GXP-1628, el más parecido.
UPDATE "EstimadorMaterial" m
SET "referenciaNombre" = v.referencia
FROM "EstimadorConfig" c,
  (VALUES
    ('Central telefónica IP',    'Grandstream Central IP 1 FXO 1 FXS 500 usuarios (UCM6301)'),
    ('Teléfono IP básico',       'Grandstream Teléfono IP 2 líneas 4 cuentas PoE (GRP2602P)'),
    ('Teléfono IP de recepción', 'Grandstream Teléfono IP 2 cuentas Gigabit 8 BLF PoE (GXP-1628)')
  ) AS v(material, referencia)
WHERE m."configId" = c."id"
  AND c."area" = 'telefonia'
  AND m."materialNombre" = v.material
  AND EXISTS (SELECT 1 FROM "PrecioReferencia" p WHERE p."userId" = c."userId" AND p."nombre" = v.referencia);
