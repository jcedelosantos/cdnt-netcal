-- Marca en precios de referencia y en proyectos (para elegir con qué marca se cotizan los equipos)

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "marca" TEXT;

-- AlterTable
ALTER TABLE "PrecioReferencia" ADD COLUMN     "marca" TEXT;

-- CreateIndex
CREATE INDEX "PrecioReferencia_marca_idx" ON "PrecioReferencia"("marca");

-- Datos: marca y categoría de los equipos ya cargados
UPDATE "PrecioReferencia" SET "marca" = 'Aruba Instant On',
  "categoria" = CASE WHEN "nombre" ILIKE '%switch%' OR "nombre" ILIKE '%1930%' THEN 'Switch' ELSE 'Access point' END
WHERE "marca" IS NULL AND ("nombre" ILIKE 'Aruba%' OR "nombre" ILIKE 'Instant On%');

UPDATE "PrecioReferencia" SET "marca" = 'TP-Link Omada',
  "categoria" = CASE
    WHEN "nombre" ILIKE 'TP-Link AP%' THEN 'Access point'
    WHEN "nombre" ILIKE '%switch%' THEN 'Switch'
    ELSE 'Router/Gateway' END
WHERE "marca" IS NULL AND "nombre" ILIKE 'TP-Link%';

UPDATE "PrecioReferencia" SET "marca" = 'Grandstream',
  "categoria" = CASE WHEN "nombre" ILIKE 'UCM%' THEN 'Central telefónica' ELSE 'Teléfono IP' END
WHERE "marca" IS NULL AND "nombre" IN ('UCM 6301 Central Telefonica', 'Teléfono IP GRP2602P', 'Teléfono IP GXP1630');

-- Datos: listas de Grandstream y Ubiquiti UniFi (Solution Box, sep. 2026). Costo de suplidor sin ITBIS a RD$63 por dólar.
-- Si ya existe un precio con el mismo nombre, se respeta el existente.
INSERT INTO "PrecioReferencia" ("id", "userId", "nombre", "categoria", "suplidor", "marca", "precio", "unidad", "fuente", "fecha", "notas", "createdAt", "updatedAt")
SELECT 'refmar' || substr(md5(random()::text || v.nombre), 1, 19), t."userId", v.nombre, v.categoria, 'Solution Box', v.marca, v.precio::double precision, 'und', 'cotizacion', NOW(), v.notas, NOW(), NOW()
FROM (SELECT "userId" FROM "EstimadorConfig" ORDER BY "activo" DESC, "updatedAt" DESC LIMIT 1) t
CROSS JOIN (VALUES
  ('Grandstream Teléfono IP DECT inalámbrico (para DP750/752) (DP-725)', 'Teléfono IP', 'Grandstream', 2659.86, 'Lista Grandstream Solution Box sep. 2026: US$42.22 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Base DECT para 5 teléfonos DP722/730 (DP-752)', 'Accesorio', 'Grandstream', 2598.12, 'Lista Grandstream Solution Box sep. 2026: US$41.24 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Módulo de extensión para GXV3350/GRP2615 (GBX20)', 'Accesorio', 'Grandstream', 6275.43, 'Lista Grandstream Solution Box sep. 2026: US$99.61 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Central IP integrada voz y video UC con firewall (GCC6010)', 'Central telefónica', 'Grandstream', 8261.19, 'Lista Grandstream Solution Box sep. 2026: US$131.13 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Portero IP con teclado y cámara, IP66 (GDS3725)', 'Otro', 'Grandstream', 9984.87, 'Lista Grandstream Solution Box sep. 2026: US$158.49 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Portero IP con teclado y cámara, IP66 (GDS3727)', 'Otro', 'Grandstream', 4364.64, 'Lista Grandstream Solution Box sep. 2026: US$69.28 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 2 líneas PoE blanco (GHP620)', 'Teléfono IP', 'Grandstream', 2279.34, 'Lista Grandstream Solution Box sep. 2026: US$36.18 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 2 líneas 2 cuentas PoE (GRP2601P)', 'Teléfono IP', 'Grandstream', 1725.57, 'Lista Grandstream Solution Box sep. 2026: US$27.39 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 2 líneas 4 cuentas PoE Gigabit (GRP2602G)', 'Teléfono IP', 'Grandstream', 1908.90, 'Lista Grandstream Solution Box sep. 2026: US$30.30 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 2 líneas 4 cuentas PoE (GRP2602P)', 'Teléfono IP', 'Grandstream', 1682.10, 'Lista Grandstream Solution Box sep. 2026: US$26.70 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 2 líneas PoE grado operador (GRP2612P)', 'Teléfono IP', 'Grandstream', 3124.17, 'Lista Grandstream Solution Box sep. 2026: US$49.59 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 4 líneas Gigabit WiFi Bluetooth (GRP2614)', 'Teléfono IP', 'Grandstream', 9242.10, 'Lista Grandstream Solution Box sep. 2026: US$146.70 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 10 líneas Gigabit WiFi Bluetooth (GRP2615)', 'Teléfono IP', 'Grandstream', 6470.73, 'Lista Grandstream Solution Box sep. 2026: US$102.71 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 6 líneas pantalla color PoE Gigabit (GRP2616)', 'Teléfono IP', 'Grandstream', 9307.62, 'Lista Grandstream Solution Box sep. 2026: US$147.74 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 8 líneas (GRP2624)', 'Teléfono IP', 'Grandstream', 4710.51, 'Lista Grandstream Solution Box sep. 2026: US$74.77 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 12 líneas WiFi PoE (GRP2636)', 'Teléfono IP', 'Grandstream', 6908.58, 'Lista Grandstream Solution Box sep. 2026: US$109.66 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 12 líneas 6 cuentas (GRP2670)', 'Teléfono IP', 'Grandstream', 8442.00, 'Lista Grandstream Solution Box sep. 2026: US$134.00 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Router dual 2 FXS WiFi 6 (GWN7062E)', 'Router/Gateway', 'Grandstream', 2022.30, 'Lista Grandstream Solution Box sep. 2026: US$32.10 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Access point WiFi 5 2x2 exterior mini (GWN7605CLR)', 'Access point', 'Grandstream', 3515.40, 'Lista Grandstream Solution Box sep. 2026: US$55.80 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Access point WiFi 6 2x2 interior 256 dispositivos (GWN7660E)', 'Access point', 'Grandstream', 2585.52, 'Lista Grandstream Solution Box sep. 2026: US$41.04 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Access point WiFi 6E 2x2 exterior (GWN7660ELR)', 'Access point', 'Grandstream', 4349.52, 'Lista Grandstream Solution Box sep. 2026: US$69.04 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Access point WiFi 6 2x2 de pared 256 dispositivos (GWN7661E)', 'Access point', 'Grandstream', 3621.87, 'Lista Grandstream Solution Box sep. 2026: US$57.49 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Access point WiFi 6 2x2 interior 512 dispositivos (GWN7664E)', 'Access point', 'Grandstream', 6940.71, 'Lista Grandstream Solution Box sep. 2026: US$110.17 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Access point WiFi 6 4x4 exterior 750 dispositivos (GWN7664ELR)', 'Access point', 'Grandstream', 8826.93, 'Lista Grandstream Solution Box sep. 2026: US$140.11 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Access point WiFi 7 2x2 interior (GWN7670)', 'Access point', 'Grandstream', 4706.73, 'Lista Grandstream Solution Box sep. 2026: US$74.71 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Switch 5 puertos Gigabit (4 PoE) no administrable 60W (GWN7700P)', 'Switch', 'Grandstream', 1638.63, 'Lista Grandstream Solution Box sep. 2026: US$26.01 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Switch 16 puertos Gigabit (8 PoE) no administrable (GWN7702P)', 'Switch', 'Grandstream', 4633.65, 'Lista Grandstream Solution Box sep. 2026: US$73.55 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Switch 6 puertos PoE exterior administrable (GWN7710R)', 'Switch', 'Grandstream', 4434.57, 'Lista Grandstream Solution Box sep. 2026: US$70.39 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Switch 8 puertos PoE L2+ 2 SFP 150W (GWN7801P)', 'Switch', 'Grandstream', 6310.08, 'Lista Grandstream Solution Box sep. 2026: US$100.16 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Switch 16 puertos PoE L2+ 4 SFP 270W (GWN7802P)', 'Switch', 'Grandstream', 10719.45, 'Lista Grandstream Solution Box sep. 2026: US$170.15 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Switch 24 puertos PoE L2+ 4 SFP 400W (GWN7803P)', 'Switch', 'Grandstream', 13507.20, 'Lista Grandstream Solution Box sep. 2026: US$214.40 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Switch 24 puertos Gigabit PoE+ (GWN7803PHP)', 'Switch', 'Grandstream', 14170.59, 'Lista Grandstream Solution Box sep. 2026: US$224.93 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Switch 24 puertos PoE L3 4 SFP+ 10G (GWN7813P)', 'Switch', 'Grandstream', 18772.74, 'Lista Grandstream Solution Box sep. 2026: US$297.98 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 2 líneas 2 cuentas PoE (GXP-1625)', 'Teléfono IP', 'Grandstream', 1731.24, 'Lista Grandstream Solution Box sep. 2026: US$27.48 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 2 cuentas Gigabit 8 BLF PoE (GXP-1628)', 'Teléfono IP', 'Grandstream', 3171.42, 'Lista Grandstream Solution Box sep. 2026: US$50.34 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 3 cuentas 8 BLF Bluetooth Gigabit (GXP-2130)', 'Teléfono IP', 'Grandstream', 5222.70, 'Lista Grandstream Solution Box sep. 2026: US$82.90 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 8 líneas 32 BLF Bluetooth Gigabit (GXP-2135)', 'Teléfono IP', 'Grandstream', 6237.00, 'Lista Grandstream Solution Box sep. 2026: US$99.00 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 4 cuentas (admite GXP2200EXT) (GXP-2140)', 'Teléfono IP', 'Grandstream', 5161.59, 'Lista Grandstream Solution Box sep. 2026: US$81.93 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 6 líneas 24 BLF recepción (GXP-2160)', 'Teléfono IP', 'Grandstream', 4852.26, 'Lista Grandstream Solution Box sep. 2026: US$77.02 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Teléfono IP 12 líneas 48 BLF Bluetooth Gigabit (GXP-2170)', 'Teléfono IP', 'Grandstream', 4864.23, 'Lista Grandstream Solution Box sep. 2026: US$77.21 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Módulo de extensión para teléfono GXP (GXP2200EXT)', 'Accesorio', 'Grandstream', 5053.23, 'Lista Grandstream Solution Box sep. 2026: US$80.21 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Central IP 1 FXO 1 FXS 500 usuarios (UCM6301)', 'Central telefónica', 'Grandstream', 12300.12, 'Lista Grandstream Solution Box sep. 2026: US$195.24 sin ITBIS, a RD$63 por dólar'),
  ('Grandstream Central IP 4 FXO 4 FXS 2000 usuarios (UCM6304)', 'Central telefónica', 'Grandstream', 37776.06, 'Lista Grandstream Solution Box sep. 2026: US$599.62 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Antena PtP 5 GHz 15 km 450 Mbps (LBE-5AC-GEN2)', 'Otro', 'Ubiquiti UniFi', 4079.25, 'Lista Ubiquiti Solution Box sep. 2026: US$64.75 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Access point WiFi 7 2x2 interior 200 dispositivos (U7-LITE)', 'Access point', 'Ubiquiti UniFi', 6718.32, 'Lista Ubiquiti Solution Box sep. 2026: US$106.64 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Access point WiFi 7 3x3 largo alcance 300 dispositivos (U7-LR)', 'Access point', 'Ubiquiti UniFi', 10098.27, 'Lista Ubiquiti Solution Box sep. 2026: US$160.29 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Access point WiFi 7 exterior (U7-OUTDOOR)', 'Access point', 'Ubiquiti UniFi', 12822.39, 'Lista Ubiquiti Solution Box sep. 2026: US$203.53 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Access point U7 Pro 2x2 2.5GbE interior 300 usuarios (U7-PRO)', 'Access point', 'Ubiquiti UniFi', 11704.14, 'Lista Ubiquiti Solution Box sep. 2026: US$185.78 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Access point WiFi 7 Pro Max (U7-PRO-MAX)', 'Access point', 'Ubiquiti UniFi', 17774.19, 'Lista Ubiquiti Solution Box sep. 2026: US$282.13 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Intercomunicador con cámara y teclado (UA-G3-INTERCOM)', 'Otro', 'Ubiquiti UniFi', 25109.91, 'Lista Ubiquiti Solution Box sep. 2026: US$398.57 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Cloud Gateway Max (UCG-MAX)', 'Router/Gateway', 'Ubiquiti UniFi', 18174.24, 'Lista Ubiquiti Solution Box sep. 2026: US$288.48 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Cloud Gateway Ultra 2.5G (UCG-ULTRA)', 'Router/Gateway', 'Ubiquiti UniFi', 7005.60, 'Lista Ubiquiti Solution Box sep. 2026: US$111.20 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi NVR UniFi Protect 4 bahías (UNVR)', 'NVR/DVR', 'Ubiquiti UniFi', 20049.12, 'Lista Ubiquiti Solution Box sep. 2026: US$318.24 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi NVR UniFi Protect Pro (UNVR-PRO)', 'NVR/DVR', 'Ubiquiti UniFi', 37178.82, 'Lista Ubiquiti Solution Box sep. 2026: US$590.14 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Switch 16 puertos (8 PoE+) 2 SFP 42W (USW-16-POE)', 'Switch', 'Ubiquiti UniFi', 19143.81, 'Lista Ubiquiti Solution Box sep. 2026: US$303.87 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Switch 24 puertos (16 PoE+) 2 SFP 95W (USW-24-POE)', 'Switch', 'Ubiquiti UniFi', 26419.68, 'Lista Ubiquiti Solution Box sep. 2026: US$419.36 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Switch Flex 8 puertos 2.5GbE (USW-Flex-2.5G-8)', 'Switch', 'Ubiquiti UniFi', 10183.32, 'Lista Ubiquiti Solution Box sep. 2026: US$161.64 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Switch Pro Max 24 puertos PoE++ 2.5G 400W L3 (USW-Pro-Max-24-PoE)', 'Switch', 'Ubiquiti UniFi', 50915.34, 'Lista Ubiquiti Solution Box sep. 2026: US$808.18 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Switch Pro 24 puertos PoE+ 2 SFP+ 400W L3 (USW-PRO-24-POE)', 'Switch', 'Ubiquiti UniFi', 47037.06, 'Lista Ubiquiti Solution Box sep. 2026: US$746.62 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Switch Pro 48 puertos PoE+ 4 SFP+ 600W L3 (USW-PRO-48-POE)', 'Switch', 'Ubiquiti UniFi', 75054.42, 'Lista Ubiquiti Solution Box sep. 2026: US$1,191.34 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Switch Lite 8 puertos PoE (USW-LITE-8-POE)', 'Switch', 'Ubiquiti UniFi', 7132.86, 'Lista Ubiquiti Solution Box sep. 2026: US$113.22 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Cámara IP UniFi G5 Flex (UVC-G5-FLEX)', 'Cámara', 'Ubiquiti UniFi', 8596.98, 'Lista Ubiquiti Solution Box sep. 2026: US$136.46 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Cámara IP G6 Instant 4K WiFi (UVC-G6-INS)', 'Cámara', 'Ubiquiti UniFi', 10187.73, 'Lista Ubiquiti Solution Box sep. 2026: US$161.71 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Cámara IP G6 Turret PoE IK04 (UVC-G6-Turret-B)', 'Cámara', 'Ubiquiti UniFi', 12991.23, 'Lista Ubiquiti Solution Box sep. 2026: US$206.21 sin ITBIS, a RD$63 por dólar'),
  ('Ubiquiti UniFi Cámara IP G6 Bullet 4K PoE 8MP (UVCG6BUL-W)', 'Cámara', 'Ubiquiti UniFi', 13170.78, 'Lista Ubiquiti Solution Box sep. 2026: US$209.06 sin ITBIS, a RD$63 por dólar')
) AS v(nombre, categoria, marca, precio, notas)
WHERE NOT EXISTS (
  SELECT 1 FROM "PrecioReferencia" p WHERE p."userId" = t."userId" AND lower(p."nombre") = lower(v.nombre)
);
