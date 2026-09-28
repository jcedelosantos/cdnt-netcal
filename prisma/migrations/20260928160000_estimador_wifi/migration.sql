-- Datos: tarifa de WiFi empresarial para el dueño del estimador de CCTV, activa.
-- Mano de obra propuesta: RD$2,500 por access point y RD$10,000 fijos (configuración de la red); editables en /estimador-web.
INSERT INTO "EstimadorConfig" ("id", "userId", "area", "activo", "margen", "rangoPct", "manoObraPorCamara", "costoFijo", "itbis", "createdAt", "updatedAt")
SELECT 'estwif' || substr(md5(random()::text), 1, 19), c."userId", 'wifi', true, c."margen", c."rangoPct", 2500, 10000, c."itbis", NOW(), NOW()
FROM "EstimadorConfig" c
WHERE c."area" = 'cctv'
ORDER BY c."activo" DESC, c."updatedAt" DESC
LIMIT 1
ON CONFLICT ("userId", "area") DO NOTHING;

-- Precios de referencia nuevos: costo de suplidor (lista Aruba Instant On de Solution Box, sep. 2026,
-- sin ITBIS, a RD$63 por dólar). Si ya existe un precio con el mismo nombre, se respeta el existente.
INSERT INTO "PrecioReferencia" ("id", "userId", "nombre", "categoria", "suplidor", "precio", "unidad", "fuente", "fecha", "notas", "createdAt", "updatedAt")
SELECT 'refwif' || substr(md5(random()::text || v.nombre), 1, 19), t."userId", v.nombre, v.categoria, 'Solution Box', v.precio::double precision, 'und', 'cotizacion', NOW(), v.notas, NOW(), NOW()
FROM "EstimadorConfig" t
CROSS JOIN (VALUES
  ('Instant On AP22 (RW) Access Point (R4W02A)', 'WiFi',  7560.00, 'Lista sep. 2026: US$120 sin ITBIS, a RD$63 por dólar'),
  ('Instant On AP25 (RW) 4x4 Wi-Fi 6 (R9B28A)',  'WiFi', 10395.00, 'Lista sep. 2026: US$165 sin ITBIS, a RD$63 por dólar'),
  ('Aruba IOn 1930 24G 4SFP+ 370W (JL684B)',     'Redes', 28350.00, 'Lista sep. 2026: US$450 sin ITBIS, a RD$63 por dólar')
) AS v(nombre, categoria, precio, notas)
WHERE t."area" = 'wifi'
  AND NOT EXISTS (
    SELECT 1 FROM "PrecioReferencia" p WHERE p."userId" = t."userId" AND lower(p."nombre") = lower(v.nombre)
  );

-- Qué precio de referencia usa cada material del WiFi (el cableado y el switch de 195 W son los de la central telefónica)
INSERT INTO "EstimadorMaterial" ("id", "configId", "materialNombre", "referenciaNombre", "incluir")
SELECT 'matwif' || substr(md5(random()::text || v.material), 1, 19), t."id", v.material, v.referencia, true
FROM "EstimadorConfig" t
CROSS JOIN (VALUES
  ('Access point Wi-Fi 6',                'Instant On AP22 (RW) Access Point (R4W02A)'),
  ('Access point alta capacidad Wi-Fi 6', 'Instant On AP25 (RW) 4x4 Wi-Fi 6 (R9B28A)'),
  ('Switch PoE 24 puertos',               'Aruba IOn 1930 24G 4SFP+ 195W (JL683B)'),
  ('Switch PoE 24 puertos 370 W',         'Aruba IOn 1930 24G 4SFP+ 370W (JL684B)'),
  ('Patch panel 24 puertos',              'LANPRO PATCH PANEL MODULAR 24 PTS'),
  ('Jack Cat6',                           'LAN JACK MODULAR CAT6 AZUL'),
  ('Patch cord Cat6 1 m',                 'LAN PATCH CORD CAT6 1 MT AZUL'),
  ('Cable UTP Cat6 (caja 305 m)',         'PANDUIT NetKey CABLE UTP CAT-6 CM AZUL')
) AS v(material, referencia)
WHERE t."area" = 'wifi'
ON CONFLICT ("configId", "materialNombre") DO NOTHING;
