-- Datos: precios de venta indicados por Cedanet para firewall (más ITBIS): instalación US$150 y configuración US$250.
-- El estimador suma 40% de margen, así que el costo de referencia es el precio de venta ÷1.4, a RD$63 por dólar:
--   instalación US$150 → RD$9,450 de venta → RD$6,750; configuración US$250 → RD$15,750 de venta → RD$11,250.
-- La configuración avanzada (VPN y políticas) sigue como adicional aparte.
UPDATE "PrecioReferencia"
SET "precio" = 6750, "fecha" = NOW(), "updatedAt" = NOW(),
    "notas" = 'Precio de venta US$150 más ITBIS (RD$9,450 a RD$63) ÷1.4'
WHERE "nombre" = 'Servicio instalación de firewall';

UPDATE "PrecioReferencia"
SET "precio" = 11250, "fecha" = NOW(), "updatedAt" = NOW(),
    "notas" = 'Precio de venta US$250 más ITBIS (RD$15,750 a RD$63) ÷1.4. Internet, red y DHCP.'
WHERE "nombre" = 'Servicio configuración firewall básica';
