export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import {
  TEMPLATE_CATEGORIES,
  THIRD_PARTY_SUPPORT_TEMPLATES,
  IT_PROJECT_TEMPLATES,
  LICENSE_TEMPLATES,
  MONTHLY_CONSUMPTION_TEMPLATES,
} from '@/lib/template-data';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { clientId, category } = await request.json();

    if (!clientId || !category) {
      return NextResponse.json(
        { error: 'clientId y category son requeridos' },
        { status: 400 }
      );
    }

    // Validar que el cliente pertenece al usuario
    const userId = (session?.user as any)?.id;
    const client = await prisma.inventoryClient.findFirst({
      where: { id: clientId, userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    let message = '';
    let count = 0;

    switch (category) {
      case TEMPLATE_CATEGORIES.THIRD_PARTY_SUPPORT:
        for (const support of THIRD_PARTY_SUPPORT_TEMPLATES) {
          // Evitar duplicados
          const exists = await prisma.inventoryThirdPartySupport.findFirst({
            where: {
              clientId,
              nombre: support.nombre,
            },
          });

          if (!exists) {
            await prisma.inventoryThirdPartySupport.create({
              data: {
                ...support,
                clientId,
              },
            });
            count++;
          }
        }
        message = `Se cargaron ${count} soportes tercerizados`;
        break;

      case TEMPLATE_CATEGORIES.IT_PROJECTS:
        for (const project of IT_PROJECT_TEMPLATES) {
          const exists = await prisma.inventoryITProject.findFirst({
            where: {
              clientId,
              nombre: project.nombre,
            },
          });

          if (!exists) {
            await prisma.inventoryITProject.create({
              data: {
                ...project,
                clientId,
              },
            });
            count++;
          }
        }
        message = `Se cargaron ${count} proyectos`;
        break;

      case TEMPLATE_CATEGORIES.LICENSES:
        for (const license of LICENSE_TEMPLATES) {
          const exists = await prisma.inventoryLicense.findFirst({
            where: {
              clientId,
              nombre: license.nombre,
            },
          });

          if (!exists) {
            await prisma.inventoryLicense.create({
              data: {
                ...license,
                clientId,
              },
            });
            count++;
          }
        }
        message = `Se cargaron ${count} licencias`;
        break;

      case TEMPLATE_CATEGORIES.CONSUMPTIONS:
        for (const consumption of MONTHLY_CONSUMPTION_TEMPLATES) {
          const exists = await prisma.inventoryMonthlyConsumption.findFirst({
            where: {
              clientId,
              nombre: consumption.nombre,
            },
          });

          if (!exists) {
            await prisma.inventoryMonthlyConsumption.create({
              data: {
                ...consumption,
                clientId,
              },
            });
            count++;
          }
        }
        message = `Se cargaron ${count} consumos`;
        break;

      default:
        return NextResponse.json(
          { error: 'Categoría no válida' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: count > 0 ? message : 'Ya existen todos estos elementos',
      loaded: count,
    });
  } catch (error: any) {
    console.error('Error loading template:', error);
    return NextResponse.json(
      { error: 'Error al cargar plantilla' },
      { status: 500 }
    );
  }
}
