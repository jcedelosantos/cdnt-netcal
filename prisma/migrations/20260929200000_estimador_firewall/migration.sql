-- Datos: tarifa de firewall para el dueño del estimador de CCTV, activa.
-- La configuración se cotiza como servicio (material), por eso mano de obra y costo fijo quedan en 0 (editables).
INSERT INTO "EstimadorConfig" ("id", "userId", "area", "activo", "margen", "rangoPct", "manoObraPorCamara", "costoFijo", "itbis", "createdAt", "updatedAt")
SELECT 'estfwl' || substr(md5(random()::text), 1, 19), c."userId", 'firewall', true, c."margen", c."rangoPct", 0, 0, c."itbis", NOW(), NOW()
FROM "EstimadorConfig" c
WHERE c."area" = 'cctv'
ORDER BY c."activo" DESC, c."updatedAt" DESC
LIMIT 1
ON CONFLICT ("userId", "area") DO NOTHING;

-- Precios de referencia (costo, sin ITBIS; el estimador suma el margen):
--  * FG-70G y su licencia UTP: cotización COT-10000170 de Omega Tech (jun. 2026) en US$, a RD$63 por dólar.
--  * FG-80F con UTP 12 meses y la configuración: cotización COT-20260206 a Proteus (feb. 2026), precio de venta ÷1.4.
--    Configuración: RD$42,000 de venta (básica + avanzada) → RD$30,000 de costo, mitad básica y mitad avanzada.
--  * Aruba Instant On SG2505P: lista de Solution Box (sep. 2026), US$290 a RD$63 por dólar.
-- Si ya existe un precio con el mismo nombre, se respeta el existente.
INSERT INTO "PrecioReferencia" ("id", "userId", "nombre", "categoria", "suplidor", "marca", "precio", "unidad", "fuente", "fecha", "notas", "createdAt", "updatedAt")
SELECT 'reffwl' || substr(md5(random()::text || v.nombre), 1, 19), t."userId", v.nombre, v.categoria, v.suplidor, v.marca, v.precio::double precision, 'und', 'cotizacion', NOW(), v.notas, NOW(), NOW()
FROM "EstimadorConfig" t
CROSS JOIN (VALUES
  ('Fortinet FortiGate-70G 10 puertos GE (FG-70G)', 'Firewall', 'Omega Tech', 'Fortinet', 59493.42, 'COT-10000170 Omega Tech: US$944.34 sin ITBIS, a RD$63 por dólar'),
  ('Fortinet licencia UTP 1 año FortiGate-70G (FC-10-GT70G-950-02-12)', 'Licencia', 'Omega Tech', 'Fortinet', 40029.57, 'COT-10000170 Omega Tech: US$635.39, a RD$63 por dólar'),
  ('Fortinet FortiGate-80F con UTP 12 meses (FG-80F-BDL-950-12)', 'Firewall', NULL, 'Fortinet', 105714.29, 'COT-20260206 a Proteus: RD$148,000 de venta ÷1.4'),
  ('Aruba Instant On Gateway 5 puertos 2.5G 64W (S0G34A)', 'Firewall', 'Solution Box', 'Aruba Instant On', 18270.00, 'Lista Solution Box sep. 2026: US$290 sin ITBIS, a RD$63 por dólar'),
  ('Servicio configuración firewall básica', 'Servicio', NULL, NULL, 15000.00, 'Internet, red y DHCP. De COT-20260206 a Proteus (RD$42,000 de venta ÷1.4, mitad)'),
  ('Servicio configuración firewall avanzada (VPN y políticas)', 'Servicio', NULL, NULL, 15000.00, 'VPN y políticas de filtrado, adicional a la básica. De COT-20260206 a Proteus (mitad)')
) AS v(nombre, categoria, suplidor, marca, precio, notas)
WHERE t."area" = 'firewall'
  AND NOT EXISTS (
    SELECT 1 FROM "PrecioReferencia" p WHERE p."userId" = t."userId" AND lower(p."nombre") = lower(v.nombre)
  );

INSERT INTO "EstimadorMaterial" ("id", "configId", "materialNombre", "referenciaNombre", "incluir")
SELECT 'matfwl' || substr(md5(random()::text || v.material), 1, 19), t."id", v.material, v.referencia, true
FROM "EstimadorConfig" t
CROSS JOIN (VALUES
  ('FortiGate pequeño (hasta 25 usuarios)',                 'Fortinet FortiGate-70G 10 puertos GE (FG-70G)'),
  ('Licencia UTP 1 año FortiGate pequeño',                  'Fortinet licencia UTP 1 año FortiGate-70G (FC-10-GT70G-950-02-12)'),
  ('FortiGate mediano con licencia UTP 1 año',              'Fortinet FortiGate-80F con UTP 12 meses (FG-80F-BDL-950-12)'),
  ('Gateway Aruba Instant On',                              'Aruba Instant On Gateway 5 puertos 2.5G 64W (S0G34A)'),
  ('Configuración de firewall básica',                      'Servicio configuración firewall básica'),
  ('Configuración de firewall avanzada (VPN y políticas)',  'Servicio configuración firewall avanzada (VPN y políticas)')
) AS v(material, referencia)
WHERE t."area" = 'firewall'
ON CONFLICT ("configId", "materialNombre") DO NOTHING;
