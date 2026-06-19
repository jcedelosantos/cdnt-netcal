import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { Workbook } from 'exceljs';

async function setupDemo() {
  try {
    console.log('🚀 Setup Demo Inventario TIC\n');

    // Get existing user john@doe.com
    let user = await prisma.user.findUnique({
      where: { email: 'john@doe.com' },
    });

    if (!user) {
      console.log('👤 Creando usuario john@doe.com...');
      const hashedPassword = await bcrypt.hash('johndoe123', 10);
      user = await prisma.user.create({
        data: {
          email: 'john@doe.com',
          name: 'John Doe',
          password: hashedPassword,
          empresaNombre: 'Cedanet Solutions',
        },
      });
      console.log(`✅ Usuario creado: ${user.email}\n`);
    } else {
      console.log(`✅ Usuario existente: ${user.email}\n`);
    }

    // Get or create client
    let client = await prisma.inventoryClient.findFirst({
      where: {
        userId: user.id,
        nombre: 'Reverse',
      },
    });

    if (!client) {
      console.log('🏢 Creando cliente Reverse...');
      client = await prisma.inventoryClient.create({
        data: {
          userId: user.id,
          nombre: 'Reverse',
          contacto: 'IT Manager',
          activo: true,
        },
      });
      console.log(`✅ Cliente creado: ${client.nombre}\n`);
    } else {
      console.log(`✅ Cliente existente: ${client.nombre}\n`);
    }

    // Create inventory
    console.log('📦 Creando inventario TIC...');
    const inventario = await prisma.ticInventario.create({
      data: {
        userId: user.id,
        clientId: client.id,
        nombre: 'Inventario 2024 - Reverse',
        descripcion: 'Importado desde Excel dispositivos_red.xlsx',
        estado: 'completado',
      },
    });
    console.log(`✅ Inventario: ${inventario.nombre} (${inventario.id})\n`);

    // Create category
    console.log('📂 Creando categoría Dispositivos de Red...');
    const categoria = await prisma.ticCategory.create({
      data: {
        inventarioId: inventario.id,
        nombre: 'Dispositivos de Red',
        orden: 0,
      },
    });
    console.log(`✅ Categoría creada\n`);

    // Load Excel and process
    console.log('📊 Cargando datos del Excel...');
    const filePath = '/Users/javiscedano/Documents/Projects/Clientes/Reverse/dispositivos_red.xlsx';
    const workbook = new Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    const articles: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const nombre = row.getCell(1).value?.toString().trim();
      const direccionIp = row.getCell(2).value?.toString().trim();
      const fabricante = row.getCell(3).value?.toString().trim();
      const direccionMac = row.getCell(4).value?.toString().trim();
      const comentarios = row.getCell(5).value?.toString().trim();

      if (nombre && nombre.toLowerCase() !== 'nombre') {
        articles.push({
          categoriaId: categoria.id,
          nombre,
          cantidad: 1,
          precioUnitario: 0,
          subtotal: 0,
          descripcion: comentarios || null,
          proveedor: fabricante || null,
        });
      }
    });

    console.log(`   📝 Artículos a crear: ${articles.length}`);

    // Create articles in batch
    if (articles.length > 0) {
      await prisma.ticArticle.createMany({
        data: articles,
      });
      console.log(`✅ ${articles.length} artículos creados\n`);
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

    console.log('═══════════════════════════════════════════════════');
    console.log('✨ INVENTARIO CREADO EXITOSAMENTE\n');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Contraseña: demo123`);
    console.log(`🏢 Cliente: ${client.nombre}`);
    console.log(`📦 Inventario: ${inventario.nombre}`);
    console.log(`📊 Categorías: 1 (Dispositivos de Red)`);
    console.log(`📝 Artículos: ${articles.length}`);
    console.log(`💰 Gasto Anual: $0.00`);
    console.log(`\n🔗 URL: /inventario-tic/${inventario.id}`);
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDemo();
