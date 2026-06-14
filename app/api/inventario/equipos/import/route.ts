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
  numeroSerie?: string; // Serie
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

    // Get headers
    const headerRow = worksheet.getRow(1);
    const headers: { [key: string]: number } = {};
    headerRow.eachCell((cell, colNumber) => {
      if (cell.value) {
        const header = cell.value.toString().toLowerCase().trim();
        headers[header] = colNumber;
      }
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const values = row.values as any[];

      // Map columns flexibly based on headers found
      const equipo: EquipoRow = {
        nombre: values[headers['nombre']]?.toString()?.trim(),
        tipoEquipo: values[headers['tipo']]?.toString()?.trim() || values[headers['tipo equipo']]?.toString()?.trim() || 'otro',
        fabricante: values[headers['fabricante']]?.toString()?.trim(),
        numeroSerie: values[headers['serie']]?.toString()?.trim() || values[headers['serial']]?.toString()?.trim() || values[headers['sn']]?.toString()?.trim(),
        direccionIp: values[headers['dirección ip']]?.toString()?.trim() || values[headers['ip']]?.toString()?.trim(),
        direccionMac: values[headers['dirección mac']]?.toString()?.trim() || values[headers['mac']]?.toString()?.trim(),
        fechaCompra: values[headers['fecha compra']]?.toString()?.trim(),
        garantia: values[headers['garantía']]?.toString()?.trim(),
        estado: values[headers['estado']]?.toString()?.trim() || 'activo',
        responsable: values[headers['responsable']]?.toString()?.trim(),
        costoUsd: values[headers['costo']] ? parseFloat(values[headers['costo']]?.toString() || '0') : 0,
        comentarios: values[headers['comentarios']]?.toString()?.trim(),
        clientId: values[headers['cliente']]?.toString()?.trim(),
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
