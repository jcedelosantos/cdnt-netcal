-- Datos: tarifa de redes (cableado estructurado) para el dueño del estimador de CCTV, activa.
-- Mano de obra propuesta: RD$2,000 por punto (tendido, canalización básica y ponchado) y RD$5,000 fijos
-- (certificación, etiquetado, transporte); editables en /estimador-web.
INSERT INTO "EstimadorConfig" ("id", "userId", "area", "activo", "margen", "rangoPct", "manoObraPorCamara", "costoFijo", "itbis", "createdAt", "updatedAt")
SELECT 'estred' || substr(md5(random()::text), 1, 19), c."userId", 'redes', true, c."margen", c."rangoPct", 2000, 5000, c."itbis", NOW(), NOW()
FROM "EstimadorConfig" c
WHERE c."area" = 'cctv'
ORDER BY c."activo" DESC, c."updatedAt" DESC
LIMIT 1
ON CONFLICT ("userId", "area") DO NOTHING;

-- Precios de referencia: cotización 7058337 de Omega Tech (1 oct. 2026), marca Nexxt (gabinete 12U Agiler),
-- costo sin ITBIS. Provisional hasta recibir la propuesta Panduit de Cablecomm.
-- Si ya existe un precio con el mismo nombre, se respeta el existente.
INSERT INTO "PrecioReferencia" ("id", "userId", "nombre", "categoria", "suplidor", "marca", "precio", "unidad", "fuente", "fecha", "notas", "createdAt", "updatedAt")
SELECT 'refred' || substr(md5(random()::text || v.nombre), 1, 19), t."userId", v.nombre, v.categoria, 'Omega Tech', v.marca, v.precio::double precision, v.unidad, 'cotizacion', NOW(),
       'Cotización 7058337 Omega Tech (1 oct. 2026), sin ITBIS', NOW(), NOW()
FROM "EstimadorConfig" t
CROSS JOIN (VALUES
  ('Nexxt rollo cable UTP Cat6 1000 pies cobre CM azul (AB356NXT32)', 'Cable', 'Nexxt', 10076.27, 'rollo'),
  ('Nexxt jack mini keystone Cat6 tipo 110 (AW121NXT21)', 'Cableado', 'Nexxt', 114.41, 'und'),
  ('Nexxt patch cable Cat6 1 pie azul (AB361NXT35)', 'Cableado', 'Nexxt', 78.81, 'und'),
  ('Nexxt patch cable Cat6 7 pies azul (AB361NXT13)', 'Cableado', 'Nexxt', 156.78, 'und'),
  ('Nexxt patch panel modular 24 puertos (AW192NXT40)', 'Cableado', 'Nexxt', 793.22, 'und'),
  ('Nexxt organizador de cables horizontal 1U 19" (AW222NXT61)', 'Rack/Gabinete', 'Nexxt', 690.68, 'und'),
  ('Agiler gabinete de pared 12U 19" puerta de cristal (AGI-INFOT39)', 'Rack/Gabinete', 'Agiler', 3783.90, 'und'),
  ('Nexxt gabinete de pared 15U (AW222NXT41)', 'Rack/Gabinete', 'Nexxt', 12669.49, 'und')
) AS v(nombre, categoria, marca, precio, unidad)
WHERE t."area" = 'redes'
  AND NOT EXISTS (
    SELECT 1 FROM "PrecioReferencia" p WHERE p."userId" = t."userId" AND lower(p."nombre") = lower(v.nombre)
  );

INSERT INTO "EstimadorMaterial" ("id", "configId", "materialNombre", "referenciaNombre", "incluir")
SELECT 'matred' || substr(md5(random()::text || v.material), 1, 19), t."id", v.material, v.referencia, true
FROM "EstimadorConfig" t
CROSS JOIN (VALUES
  ('Rollo cable UTP Cat6 (1000 pies)',      'Nexxt rollo cable UTP Cat6 1000 pies cobre CM azul (AB356NXT32)'),
  ('Jack keystone Cat6',                    'Nexxt jack mini keystone Cat6 tipo 110 (AW121NXT21)'),
  ('Patch cord Cat6 1 pie (gabinete)',      'Nexxt patch cable Cat6 1 pie azul (AB361NXT35)'),
  ('Patch cord Cat6 7 pies (equipo)',       'Nexxt patch cable Cat6 7 pies azul (AB361NXT13)'),
  ('Patch panel modular 24 puertos',        'Nexxt patch panel modular 24 puertos (AW192NXT40)'),
  ('Organizador de cables horizontal 1U',   'Nexxt organizador de cables horizontal 1U 19" (AW222NXT61)'),
  ('Gabinete de pared 12U',                 'Agiler gabinete de pared 12U 19" puerta de cristal (AGI-INFOT39)'),
  ('Gabinete de pared 15U',                 'Nexxt gabinete de pared 15U (AW222NXT41)')
) AS v(material, referencia)
WHERE t."area" = 'redes'
ON CONFLICT ("configId", "materialNombre") DO NOTHING;
