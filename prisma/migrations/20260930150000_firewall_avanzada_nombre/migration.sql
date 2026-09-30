-- Datos: la configuración avanzada de firewall incluye VPN, segmentación de la red y políticas de seguridad.
UPDATE "EstimadorMaterial"
SET "materialNombre" = 'Configuración de firewall avanzada (VPN, segmentación de red y políticas de seguridad)'
WHERE "materialNombre" = 'Configuración de firewall avanzada (VPN y políticas)';

UPDATE "PrecioReferencia"
SET "nombre" = 'Servicio configuración firewall avanzada (VPN, segmentación y políticas de seguridad)',
    "notas" = 'VPN, segmentación de la red y políticas de seguridad, adicional a la básica. De COT-20260206 a Proteus',
    "updatedAt" = NOW()
WHERE "nombre" = 'Servicio configuración firewall avanzada (VPN y políticas)';

UPDATE "EstimadorMaterial"
SET "referenciaNombre" = 'Servicio configuración firewall avanzada (VPN, segmentación y políticas de seguridad)'
WHERE "referenciaNombre" = 'Servicio configuración firewall avanzada (VPN y políticas)';
