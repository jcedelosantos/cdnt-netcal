const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USER_ID = 'cmqem12lo0000scwh4zuyya5b'; // john@doe.com

const facturas = [
  {
    nombre: 'Iguala Servicios Profesionales - Club Naco Mayo 2026',
    cliente: 'CLUB DEPORTIVO NACO, Inc',
    clienteRNC: '401051712',
    numeroFactura: 'B01-00000484',
    facturadoEn: new Date('2026-05-05'),
    costoManoObra: 40000,
    itbis: 18,
    estadoPago: 'pendiente',
  },
  {
    nombre: 'Servicio Experto ICG Software - Floripa SRL',
    cliente: 'FLORIPA SRL',
    clienteRNC: '131744222',
    numeroFactura: 'B01-00000485',
    facturadoEn: new Date('2026-05-05'),
    costoManoObra: 21186.44,
    itbis: 18,
    estadoPago: 'pendiente',
  },
  {
    nombre: 'Servicio Profesional IT Mayo 2026 - Reverse',
    cliente: 'REVERSE, SRL',
    clienteRNC: '130893861',
    numeroFactura: 'B01-00000486',
    facturadoEn: new Date('2026-05-05'),
    costoManoObra: 16949.15,
    itbis: 18,
    estadoPago: 'pendiente',
  },
  {
    nombre: 'Licencias HIOPOS Cloud y HiOffice - Pico Gourmet',
    cliente: 'PICO GOURMET',
    clienteRNC: null,
    numeroFactura: 'B01-00000487',
    facturadoEn: new Date('2026-05-05'),
    costoManoObra: 15000,
    itbis: 0, // artículos no sujetos a ITBIS
    estadoPago: 'pagado',
  },
  {
    nombre: 'Zkteco FaceSense 4A + Instalación - Cartisa',
    cliente: 'Cartisa SAS',
    clienteRNC: '101591315',
    numeroFactura: 'B01-00000489',
    facturadoEn: new Date('2026-05-07'),
    costoManoObra: 15000,
    itbis: 18,
    estadoPago: 'pagado',
  },
  {
    nombre: 'Solución POS y Cableado Área Técnica - Reverse',
    cliente: 'REVERSE, SRL',
    clienteRNC: '130893861',
    numeroFactura: 'B01-00000490',
    facturadoEn: new Date('2026-05-18'),
    costoManoObra: 35700,
    itbis: 18,
    estadoPago: 'pendiente',
  },
  {
    nombre: 'Tinta Epson L5590 - Reverse',
    cliente: 'REVERSE, SRL',
    clienteRNC: '130893861',
    numeroFactura: 'B01-00000491',
    facturadoEn: new Date('2026-05-18'),
    costoManoObra: 1800,
    itbis: 18,
    estadoPago: 'pendiente',
  },
  {
    nombre: 'Materiales de Red y Servicio Técnico Yoselin - Reverse',
    cliente: 'REVERSE, SRL',
    clienteRNC: '130893861',
    numeroFactura: 'B01-00000492',
    facturadoEn: new Date('2026-05-18'),
    costoManoObra: 9500,
    itbis: 18,
    estadoPago: 'pendiente',
  },
  {
    nombre: 'Timbre Inalámbrico y Servicio Técnico - CK Trans Motors',
    cliente: 'CK TRANS MOTORS SRL',
    clienteRNC: '31733719',
    numeroFactura: 'B01-00000493',
    facturadoEn: new Date('2026-05-19'),
    costoManoObra: 4000,
    itbis: 18,
    estadoPago: 'pendiente',
  },
  {
    nombre: 'Servicio Profesional Revisión PC y Mac - SCavoli',
    cliente: 'SCavoli Bernal',
    clienteRNC: '131332927',
    numeroFactura: 'B01-00000495',
    facturadoEn: new Date('2026-05-22'),
    costoManoObra: 6000,
    itbis: 18,
    estadoPago: 'pendiente',
  },
  {
    nombre: 'Cableado Estructurado Oficina TI - CK Trans Motors',
    cliente: 'CK TRANS MOTORS SRL',
    clienteRNC: '31733719',
    numeroFactura: 'B01-00000497',
    facturadoEn: new Date('2026-05-27'),
    costoManoObra: 9450,
    itbis: 18,
    estadoPago: 'pendiente',
  },
];

async function main() {
  console.log(`Importando ${facturas.length} facturas de Mayo 2026...\n`);
  let created = 0;
  let skipped = 0;

  for (const f of facturas) {
    // Evitar duplicados por número de factura
    const existing = await prisma.project.findFirst({
      where: { numeroFactura: f.numeroFactura, userId: USER_ID },
    });

    if (existing) {
      console.log(`  ⚠  Ya existe: ${f.numeroFactura} — omitido`);
      skipped++;
      continue;
    }

    const project = await prisma.project.create({
      data: {
        userId: USER_ID,
        nombre: f.nombre,
        cliente: f.cliente,
        clienteRNC: f.clienteRNC,
        numeroFactura: f.numeroFactura,
        facturadoEn: f.facturadoEn,
        fecha: f.facturadoEn,
        aprobado: true,
        aprobadoEn: f.facturadoEn,
        estadoPago: f.estadoPago,
        costoManoObra: f.costoManoObra,
        itbis: f.itbis,
        moneda: 'DOP',
      },
    });

    const subtotal = f.costoManoObra;
    const itbisValor = subtotal * (f.itbis / 100);
    const total = subtotal + itbisValor;

    console.log(`  ✓  ${f.numeroFactura} | ${f.cliente.padEnd(30)} | RD$ ${total.toLocaleString('es-DO')} | ${f.estadoPago}`);
    created++;
  }

  console.log(`\nResultado: ${created} creados, ${skipped} omitidos.`);
  console.log('\nTotales Mayo 2026:');
  const totalSubtotal = facturas.reduce((s, f) => s + f.costoManoObra, 0);
  const totalITBIS = facturas.reduce((s, f) => s + f.costoManoObra * f.itbis / 100, 0);
  console.log(`  Subtotal:  RD$ ${totalSubtotal.toLocaleString('es-DO', {minimumFractionDigits: 2})}`);
  console.log(`  ITBIS:     RD$ ${totalITBIS.toLocaleString('es-DO', {minimumFractionDigits: 2})}`);
  console.log(`  Total:     RD$ ${(totalSubtotal + totalITBIS).toLocaleString('es-DO', {minimumFractionDigits: 2})}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
