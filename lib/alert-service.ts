import { prisma } from './prisma';
import { differenceInDays } from 'date-fns';

interface AlertConfig {
  diasAntesDelVencimiento: number; // default: 30 días
  diasSinMantenimiento: number; // default: 365 días
}

const defaultConfig: AlertConfig = {
  diasAntesDelVencimiento: 30,
  diasSinMantenimiento: 365,
};

/**
 * Genera alertas para licencias próximas a vencer
 */
export async function generateLicenseAlerts(userId: string, config = defaultConfig) {
  try {
    const licenses = await prisma.inventoryLicense.findMany({
      where: {
        client: { userId },
        estado: { in: ['activa', 'por_vencer'] },
        fechaVencimiento: { not: null },
      },
    });

    const alerts: any[] = [];

    for (const license of licenses) {
      if (!license.fechaVencimiento) continue;

      const diasParaVencer = differenceInDays(license.fechaVencimiento, new Date());

      if (diasParaVencer <= 0) {
        // Licencia ya venció
        alerts.push({
          userId,
          tipo: 'licencia_vence',
          titulo: `Licencia vencida: ${license.nombre}`,
          descripcion: `La licencia ${license.nombre} vencio el ${license.fechaVencimiento.toLocaleDateString('es-DO')}`,
          severidad: 'critical',
          referenceId: license.id,
          referenceType: 'license',
        });
      } else if (diasParaVencer <= config.diasAntesDelVencimiento) {
        // Licencia próxima a vencer
        alerts.push({
          userId,
          tipo: 'licencia_vence',
          titulo: `Licencia próxima a vencer: ${license.nombre}`,
          descripcion: `${license.nombre} vence en ${diasParaVencer} días (${license.fechaVencimiento.toLocaleDateString('es-DO')})`,
          severidad: diasParaVencer <= 7 ? 'critical' : 'warning',
          referenceId: license.id,
          referenceType: 'license',
        });
      }
    }

    // Guardar alertas si no existen
    for (const alert of alerts) {
      const existing = await prisma.alert.findFirst({
        where: {
          userId: alert.userId,
          tipo: alert.tipo,
          referenceId: alert.referenceId,
          leido: false,
        },
      });

      if (!existing) {
        await prisma.alert.create({ data: alert });
      }
    }

    return alerts.length;
  } catch (error) {
    console.error('Error generating license alerts:', error);
    return 0;
  }
}

/**
 * Genera alertas para equipos sin mantenimiento reciente
 */
export async function generateMaintenanceAlerts(userId: string, config = defaultConfig) {
  try {
    const equipment = await prisma.inventoryEquipment.findMany({
      where: {
        client: { userId },
        estado: 'activo',
      },
    });

    const alerts: any[] = [];
    const now = new Date();

    for (const item of equipment) {
      const lastMaintenanceOrCreation = item.updatedAt || item.createdAt;
      const daysSinceUpdate = differenceInDays(now, lastMaintenanceOrCreation);

      if (daysSinceUpdate >= config.diasSinMantenimiento) {
        alerts.push({
          userId,
          tipo: 'equipo_mantenimiento',
          titulo: `${item.nombre} requiere mantenimiento`,
          descripcion: `El equipo ${item.nombre} no ha tenido mantenimiento en ${daysSinceUpdate} días`,
          severidad: daysSinceUpdate >= config.diasSinMantenimiento * 1.5 ? 'critical' : 'warning',
          referenceId: item.id,
          referenceType: 'equipment',
        });
      }
    }

    // Guardar alertas si no existen
    for (const alert of alerts) {
      const existing = await prisma.alert.findFirst({
        where: {
          userId: alert.userId,
          tipo: alert.tipo,
          referenceId: alert.referenceId,
          leido: false,
        },
      });

      if (!existing) {
        await prisma.alert.create({ data: alert });
      }
    }

    return alerts.length;
  } catch (error) {
    console.error('Error generating maintenance alerts:', error);
    return 0;
  }
}

/**
 * Genera alertas para facturas pendientes de pago
 */
export async function generatePaymentAlerts(userId: string) {
  try {
    const projects = await prisma.project.findMany({
      where: {
        userId,
        numeroFactura: { not: null },
        estadoPago: { not: 'pagado' },
      },
    });

    const alerts: any[] = [];

    for (const project of projects) {
      const diasPendiente = differenceInDays(new Date(), project.facturadoEn || project.createdAt);

      if (diasPendiente > 30) {
        alerts.push({
          userId,
          tipo: 'pago_pendiente',
          titulo: `Factura pendiente: ${project.nombre}`,
          descripcion: `${project.nombre} lleva ${diasPendiente} días pendiente de pago`,
          severidad: diasPendiente > 60 ? 'critical' : 'warning',
          referenceId: project.id,
          referenceType: 'project',
        });
      }
    }

    // Guardar alertas
    for (const alert of alerts) {
      const existing = await prisma.alert.findFirst({
        where: {
          userId: alert.userId,
          tipo: alert.tipo,
          referenceId: alert.referenceId,
          leido: false,
        },
      });

      if (!existing) {
        await prisma.alert.create({ data: alert });
      }
    }

    return alerts.length;
  } catch (error) {
    console.error('Error generating payment alerts:', error);
    return 0;
  }
}

/**
 * Genera alertas para artículos TIC con fecha de vencimiento próxima
 */
export async function generateTicLicenseAlerts(userId: string, config = defaultConfig) {
  try {
    const articulos = await prisma.ticArticle.findMany({
      where: {
        fechaVencimiento: { not: null },
        categoria: { inventario: { userId } },
      },
      include: {
        categoria: { include: { inventario: { select: { nombre: true } } } },
      },
    });

    const alerts: any[] = [];

    for (const art of articulos) {
      if (!art.fechaVencimiento) continue;
      const diasParaVencer = differenceInDays(art.fechaVencimiento, new Date());

      if (diasParaVencer <= 0) {
        alerts.push({
          userId,
          tipo: 'tic_licencia_vence',
          titulo: `Licencia vencida: ${art.nombre}`,
          descripcion: `${art.nombre} (${art.categoria.inventario.nombre}) venció el ${art.fechaVencimiento.toLocaleDateString('es-DO')}`,
          severidad: 'critical',
          referenceId: art.id,
          referenceType: 'tic_article',
        });
      } else if (diasParaVencer <= config.diasAntesDelVencimiento) {
        alerts.push({
          userId,
          tipo: 'tic_licencia_vence',
          titulo: `Licencia próxima a vencer: ${art.nombre}`,
          descripcion: `${art.nombre} (${art.categoria.inventario.nombre}) vence en ${diasParaVencer} días — ${art.fechaVencimiento.toLocaleDateString('es-DO')}`,
          severidad: diasParaVencer <= 7 ? 'critical' : 'warning',
          referenceId: art.id,
          referenceType: 'tic_article',
        });
      }
    }

    for (const alert of alerts) {
      const existing = await prisma.alert.findFirst({
        where: { userId: alert.userId, tipo: alert.tipo, referenceId: alert.referenceId, leido: false },
      });
      if (!existing) await prisma.alert.create({ data: alert });
    }

    return alerts.length;
  } catch (error) {
    console.error('Error generating TIC license alerts:', error);
    return 0;
  }
}

/**
 * Genera todas las alertas para un usuario
 */
export async function generateAllAlerts(userId: string, config = defaultConfig) {
  const licenseAlerts = await generateLicenseAlerts(userId, config);
  const maintenanceAlerts = await generateMaintenanceAlerts(userId, config);
  const paymentAlerts = await generatePaymentAlerts(userId);
  const ticLicenseAlerts = await generateTicLicenseAlerts(userId, config);

  return {
    licenseAlerts,
    maintenanceAlerts,
    paymentAlerts,
    ticLicenseAlerts,
    total: licenseAlerts + maintenanceAlerts + paymentAlerts + ticLicenseAlerts,
  };
}

/**
 * Marca alertas como leídas
 */
export async function markAlertsAsRead(userId: string, alertIds: string[]) {
  try {
    await prisma.alert.updateMany({
      where: {
        id: { in: alertIds },
        userId,
      },
      data: { leido: true },
    });
    return true;
  } catch (error) {
    console.error('Error marking alerts as read:', error);
    return false;
  }
}

/**
 * Obtiene alertas no leídas de un usuario
 */
export async function getUnreadAlerts(userId: string) {
  try {
    return await prisma.alert.findMany({
      where: {
        userId,
        leido: false,
      },
      orderBy: [{ severidad: 'desc' }, { createdAt: 'desc' }],
    });
  } catch (error) {
    console.error('Error fetching unread alerts:', error);
    return [];
  }
}
