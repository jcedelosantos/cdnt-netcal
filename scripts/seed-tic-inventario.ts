import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import { Workbook } from 'exceljs';

async function seedInventario() {
  try {
    console.log('🚀 Iniciando creación de inventario TIC...\n');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: 'john@doe.com' },
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    // Get or create client
    let client = await prisma.inventoryClient.findFirst({
      where: {
        userId: user.id,
        nombre: 'Reverse',
      },
    });

    if (!client) {
      console.log('📝 Creando cliente Reverse...');
      client = await prisma.inventoryClient.create({
        data: {
          userId: user.id,
          nombre: 'Reverse',
          contacto: 'IT Manager',
          activo: true,
        },
      });
    }

    console.log(`✅ Cliente: ${client.nombre} (${client.id})\n`);

    // Create inventory
    console.log('📦 Creando inventario TIC...');
    const inventario = await prisma.ticInventario.create({
      data: {
        userId: user.id,
        clientId: client.id,
        nombre: 'Inventario 2024 - Reverse',
        descripcion: 'Importado desde Excel dispositivos_red.xlsx',
        estado: 'borrador',
      },
    });

    console.log(`✅ Inventario: ${inventario.nombre}\n`);

    // Create category for network devices
    console.log('📂 Creando categoría...');
    const categoria = await prisma.ticCategory.create({
      data: {
        inventarioId: inventario.id,
        nombre: 'Dispositivos de Red',
        orden: 0,
      },
    });

    console.log(`✅ Categoría: ${categoria.nombre}\n`);

    // Load and process Excel
    console.log('📊 Procesando Excel...');
    const filePath = '/Users/javiscedano/Documents/Projects/Clientes/Reverse/dispositivos_red.xlsx';

    const workbook = new Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    let articlesCount = 0;
    const errors: any[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      try {
        const nombre = row.getCell(1).value?.toString().trim();
        const direccionIp = row.getCell(2).value?.toString().trim();
        const fabricante = row.getCell(3).value?.toString().trim();
        const direccionMac = row.getCell(4).value?.toString().trim();
        const comentarios = row.getCell(5).value?.toString().trim();

        if (!nombre || nombre.toLowerCase() === 'nombre') return; // Skip empty or header rows

        // Create article
        prisma.ticArticle.create({
          data: {
            categoriaId: categoria.id,
            nombre,
            cantidad: 1,
            precioUnitario: 0,
            subtotal: 0,
            descripcion: comentarios,
            proveedor: fabricante,
          },
        }).then(() => {
          articlesCount++;
          process.stdout.write(`\r   Artículos procesados: ${articlesCount}`);
        }).catch((e) => {
          errors.push({
            row: rowNumber,
            error: e.message,
          });
        });
      } catch (e: any) {
        errors.push({
          row: rowNumber,
          error: e.message,
        });
      }
    });

    // Wait a bit for all creates to finish
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`\n\n✅ Artículos creados: ${articlesCount}`);
    if (errors.length > 0) {
      console.log(`⚠️  Errores: ${errors.length}`);
      errors.slice(0, 3).forEach((err) => {
        console.log(`   Fila ${err.row}: ${err.error}`);
      });
    }

    // Update category total
    const articulos = await prisma.ticArticle.findMany({
      where: { categoriaId: categoria.id },
    });

    const gastoTotal = articulos.reduce((sum, art) => sum + (art.subtotal || 0), 0);
    await prisma.ticCategory.update({
      where: { id: categoria.id },
      data: { gastoTotal },
    });

    // Update inventory total
    await prisma.ticInventario.update({
      where: { id: inventario.id },
      data: { gastoAnual: gastoTotal },
    });

    console.log(`\n✨ Inventario creado exitosamente!`);
    console.log(`   ID: ${inventario.id}`);
    console.log(`   URL: /inventario-tic/${inventario.id}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedInventario();
