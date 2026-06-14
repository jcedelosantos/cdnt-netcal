export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { Workbook } from 'exceljs';

interface EquipoRow {
  nombre?: string;
  tipoEquipo?: string;
  fabricante?: string;
  numeroSerie?: string;
  direccionIp?: string;
  direccionMac?: string;
  fechaCompra?: string;
  garantia?: string;
  estado?: string;
  responsable?: string;
  costoUsd?: number | string;
  comentarios?: string;
  clientId?: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const userId = (session?.user as any)?.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      return NextResponse.json({ error: 'No worksheet found' }, { status: 400 });
    }

    // Parse rows
    const rows: EquipoRow[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const values = row.values as any[];
      const equipo: EquipoRow = {
        nombre: values[1]?.toString()?.trim(),
        tipoEquipo: values[2]?.toString()?.trim() || 'otro',
        fabricante: values[3]?.toString()?.trim(),
        numeroSerie: values[4]?.toString()?.trim(),
        direccionIp: values[5]?.toString()?.trim(),
        direccionMac: values[6]?.toString()?.trim(),
        fechaCompra: values[7]?.toString()?.trim(),
        garantia: values[8]?.toString()?.trim(),
        estado: values[9]?.toString()?.trim() || 'activo',
        responsable: values[10]?.toString()?.trim(),
        costoUsd: values[11] ? parseFloat(values[11]) : 0,
        comentarios: values[12]?.toString()?.trim(),
        clientId: values[13]?.toString()?.trim(),
      };

      // Validate required fields
      if (!equipo.nombre) {
        errors.push({ row: rowNumber, error: 'Nombre es requerido' });
        return;
      }

      rows.push(equipo);
    });

    // Get user's inventory client (if exists)
    const userClients = await prisma.inventoryClient.findMany({
      where: { userId },
      select: { id: true },
    });

    const defaultClientId = userClients[0]?.id;

    // Insert equipos
    let imported = 0;
    for (const equipo of rows) {
      try {
        await prisma.inventoryEquipment.create({
          data: {
            nombre: equipo.nombre,
            tipoEquipo: equipo.tipoEquipo || 'otro',
            fabricante: equipo.fabricante,
            numeroSerie: equipo.numeroSerie,
            direccionIp: equipo.direccionIp || null,
            direccionMac: equipo.direccionMac || null,
            fechaCompra: equipo.fechaCompra
              ? new Date(equipo.fechaCompra).toISOString()
              : null,
            garantia: equipo.garantia
              ? new Date(equipo.garantia).toISOString()
              : null,
            estado: equipo.estado || 'activo',
            responsable: equipo.responsable,
            costoUsd: typeof equipo.costoUsd === 'string'
              ? parseFloat(equipo.costoUsd)
              : equipo.costoUsd || 0,
            comentarios: equipo.comentarios,
            clientId: equipo.clientId || defaultClientId,
          },
        });
        imported++;
      } catch (e) {
        console.error(`Error importing row:`, e);
        errors.push({ row: rows.indexOf(equipo) + 2, error: 'Error al insertar' });
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
      total: rows.length,
      message: `Se importaron ${imported} equipos${errors.length > 0 ? `, ${errors.length} errores` : ''}`,
    });
  } catch (error: any) {
    console.error('Error importing equipos:', error);
    return NextResponse.json(
      { error: 'Error al procesar archivo' },
      { status: 500 }
    );
  }
}
