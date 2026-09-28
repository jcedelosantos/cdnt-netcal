-- Datos: precios de referencia de TP-Link Omada (lista de Solution Box, sep. 2026), como alternativa a Aruba Instant On.
-- No se asignan a ningún estimador: Aruba Instant On sigue siendo la primera recomendación.
-- Precios de suplidor en US$ (se asumen sin ITBIS, como las demás listas de Solution Box), a RD$63 por dólar.
INSERT INTO "PrecioReferencia" ("id", "userId", "nombre", "categoria", "suplidor", "precio", "unidad", "fuente", "fecha", "notas", "createdAt", "updatedAt")
SELECT 'reftpl' || substr(md5(random()::text || v.nombre), 1, 19), t."userId", v.nombre, v.categoria, 'Solution Box', v.precio::double precision, 'und', 'cotizacion', NOW(), v.notas, NOW(), NOW()
FROM (SELECT "userId" FROM "EstimadorConfig" WHERE "area" = 'wifi' LIMIT 1) t
CROSS JOIN (VALUES
  ('TP-Link AP Omada Wi-Fi 6 2x2 interior 250 usuarios (EAP610)', 'WiFi', 4498.83, 'Lista TP-Link Omada: US$71.41, a RD$63 por dólar'),
  ('TP-Link AP Omada Wi-Fi 5 2x2 exterior 220 usuarios (EAP610-Outdoor)', 'WiFi', 6691.86, 'Lista TP-Link Omada: US$106.22, a RD$63 por dólar'),
  ('TP-Link AP Omada Wi-Fi 6 de pared (EAP615-Wall)', 'WiFi', 3591.63, 'Lista TP-Link Omada: US$57.01, a RD$63 por dólar'),
  ('TP-Link AP Omada Wi-Fi 6 interior 250 usuarios (EAP650)', 'WiFi', 5652.36, 'Lista TP-Link Omada: US$89.72, a RD$63 por dólar'),
  ('TP-Link AP Omada AX3000 interior/exterior Wi-Fi 6 (EAP650-Outdoor)', 'WiFi', 6973.47, 'Lista TP-Link Omada: US$110.69, a RD$63 por dólar'),
  ('TP-Link AP Omada Wi-Fi 6 4x4 interior 1000 usuarios (EAP660HD)', 'WiFi', 10073.07, 'Lista TP-Link Omada: US$159.89, a RD$63 por dólar'),
  ('TP-Link Router VPN/balanceador Omada 5 puertos (ER7206)', 'Redes', 5408.55, 'Lista TP-Link Omada: US$85.85, a RD$63 por dólar'),
  ('TP-Link Omada Cloud Controller (OC200)', 'Redes', 3573.36, 'Lista TP-Link Omada: US$56.72, a RD$63 por dólar'),
  ('TP-Link Switch Omada 8 puertos PoE 2 SFP smart (SG2210P)', 'Redes', 4716.18, 'Lista TP-Link Omada: US$74.86, a RD$63 por dólar'),
  ('TP-Link Switch Omada 24 puertos PoE+ 4 SFP+ (SG3428XMP)', 'Redes', 20318.13, 'Lista TP-Link Omada: US$322.51, a RD$63 por dólar'),
  ('TP-Link Switch Omada 48 puertos 4 SFP+ L2+ (SG3452)', 'Redes', 16689.96, 'Lista TP-Link Omada: US$264.92, a RD$63 por dólar'),
  ('TP-Link Switch TP-Link 48 puertos Gigabit rack no administrable (TL-SG1048)', 'Redes', 10612.35, 'Lista TP-Link Omada: US$168.45, a RD$63 por dólar')
) AS v(nombre, categoria, precio, notas)
WHERE NOT EXISTS (
  SELECT 1 FROM "PrecioReferencia" p WHERE p."userId" = t."userId" AND lower(p."nombre") = lower(v.nombre)
);
