-- Datos: el estimador de redes incluye el switch (Aruba Instant On, primera recomendación).
-- Hasta 6 puntos: switch de 8 puertos; más: 1930 de 24 puertos. Precios ya cargados para WiFi.
INSERT INTO "EstimadorMaterial" ("id", "configId", "materialNombre", "referenciaNombre", "incluir")
SELECT 'matrsw' || substr(md5(random()::text || v.material), 1, 19), t."id", v.material, v.referencia, true
FROM "EstimadorConfig" t
CROSS JOIN (VALUES
  ('Switch 8 puertos',  'Aruba Instant On switch 8 puertos PoE'),
  ('Switch 24 puertos', 'Aruba IOn 1930 24G 4SFP+ 195W (JL683B)')
) AS v(material, referencia)
WHERE t."area" = 'redes'
ON CONFLICT ("configId", "materialNombre") DO NOTHING;
