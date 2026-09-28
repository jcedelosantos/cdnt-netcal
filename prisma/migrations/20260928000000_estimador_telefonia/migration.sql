-- Una tarifa del estimador web por área (CCTV, central telefónica)

-- DropIndex
DROP INDEX "EstimadorConfig_userId_key";

-- AlterTable
ALTER TABLE "EstimadorConfig" ADD COLUMN     "area" TEXT NOT NULL DEFAULT 'cctv';

-- CreateIndex
CREATE UNIQUE INDEX "EstimadorConfig_userId_area_key" ON "EstimadorConfig"("userId", "area");

-- Datos: tarifa de central telefónica para el dueño del estimador de CCTV, activa,
-- con mano de obra de RD$2,000 por extensión y RD$15,000 fijos por configurar la central.
INSERT INTO "EstimadorConfig" ("id", "userId", "area", "activo", "margen", "rangoPct", "manoObraPorCamara", "costoFijo", "itbis", "createdAt", "updatedAt")
SELECT 'esttel' || substr(md5(random()::text), 1, 19), c."userId", 'telefonia', true, c."margen", c."rangoPct", 2000, 15000, c."itbis", NOW(), NOW()
FROM "EstimadorConfig" c
WHERE c."area" = 'cctv'
ORDER BY c."activo" DESC, c."updatedAt" DESC
LIMIT 1
ON CONFLICT ("userId", "area") DO NOTHING;

-- Precios de referencia. Los de la cotización CDNT-COT-367 (Reverse, oct. 2024) son precios de venta:
-- se suben 15% por antigüedad y se dividen entre 1.4 para llevarlos a costo (el estimador suma el margen).
-- El switch es costo de suplidor (oferta de Solution Box, sep. 2026, US$320 sin ITBIS a RD$63 por dólar).
-- Si ya existe un precio con el mismo nombre, se respeta el existente.
INSERT INTO "PrecioReferencia" ("id", "userId", "nombre", "categoria", "suplidor", "precio", "unidad", "fuente", "fecha", "notas", "createdAt", "updatedAt")
SELECT 'reftel' || substr(md5(random()::text || v.nombre), 1, 19), t."userId", v.nombre, v.categoria, v.suplidor, v.precio::double precision, v.unidad, 'cotizacion', NOW(), v.notas, NOW(), NOW()
FROM "EstimadorConfig" t
CROSS JOIN (VALUES
  ('UCM 6301 Central Telefonica',            'Telefonía', NULL,          13553.57, 'und',  'CDNT-COT-367: RD$16,500 +15% ÷1.4'),
  ('Teléfono IP GRP2602P',                   'Telefonía', NULL,           2341.07, 'und',  'CDNT-COT-367: RD$2,850 +15% ÷1.4'),
  ('Teléfono IP GXP1630',                    'Telefonía', NULL,           2423.21, 'und',  'CDNT-COT-367: RD$2,950 +15% ÷1.4'),
  ('LANPRO PATCH PANEL MODULAR 24 PTS',      'Cableado',  NULL,           1355.36, 'und',  'CDNT-COT-367: RD$1,650 +15% ÷1.4'),
  ('LAN JACK MODULAR CAT6 AZUL',             'Cableado',  NULL,            164.29, 'und',  'CDNT-COT-367: RD$200 +15% ÷1.4'),
  ('LAN PATCH CORD CAT6 1 MT AZUL',          'Cableado',  NULL,            151.96, 'und',  'CDNT-COT-367: RD$185 +15% ÷1.4'),
  ('PANDUIT NetKey CABLE UTP CAT-6 CM AZUL', 'Cableado',  NULL,           9733.93, 'caja', 'CDNT-COT-367: RD$11,850 +15% ÷1.4'),
  ('Aruba IOn 1930 24G 4SFP+ 195W (JL683B)', 'Redes',     'Solution Box', 20160.00, 'und', 'Oferta sep. 2026: US$320 sin ITBIS, a RD$63 por dólar')
) AS v(nombre, categoria, suplidor, precio, unidad, notas)
WHERE t."area" = 'telefonia'
  AND NOT EXISTS (
    SELECT 1 FROM "PrecioReferencia" p WHERE p."userId" = t."userId" AND lower(p."nombre") = lower(v.nombre)
  );

-- Qué precio de referencia usa cada material de la central telefónica
INSERT INTO "EstimadorMaterial" ("id", "configId", "materialNombre", "referenciaNombre", "incluir")
SELECT 'mattel' || substr(md5(random()::text || v.material), 1, 19), t."id", v.material, v.referencia, true
FROM "EstimadorConfig" t
CROSS JOIN (VALUES
  ('Central telefónica IP',       'UCM 6301 Central Telefonica'),
  ('Teléfono IP básico',          'Teléfono IP GRP2602P'),
  ('Teléfono IP de recepción',    'Teléfono IP GXP1630'),
  ('Patch panel 24 puertos',      'LANPRO PATCH PANEL MODULAR 24 PTS'),
  ('Jack Cat6',                   'LAN JACK MODULAR CAT6 AZUL'),
  ('Patch cord Cat6 1 m',         'LAN PATCH CORD CAT6 1 MT AZUL'),
  ('Cable UTP Cat6 (caja 305 m)', 'PANDUIT NetKey CABLE UTP CAT-6 CM AZUL'),
  ('Switch PoE 24 puertos',       'Aruba IOn 1930 24G 4SFP+ 195W (JL683B)')
) AS v(material, referencia)
WHERE t."area" = 'telefonia'
ON CONFLICT ("configId", "materialNombre") DO NOTHING;
