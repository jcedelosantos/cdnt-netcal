import { prisma } from '@/lib/prisma';

async function fix() {
  try {
    // Get first user
    const user = await prisma.user.findFirst();
    console.log('Current user:', user?.email);

    if (!user) {
      console.log('No users found');
      return;
    }

    // Get last created inventory
    const inventory = await prisma.ticInventario.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    console.log('Inventory ID:', inventory?.id);

    // Update inventory to current user
    if (inventory && inventory.userId !== user.id) {
      const updated = await prisma.ticInventario.update({
        where: { id: inventory.id },
        data: { userId: user.id },
      });
      console.log('✅ Updated inventory for user:', user.email);
      console.log(`URL: /inventario-tic/${updated.id}`);
    } else {
      console.log('✅ Inventory already assigned to correct user');
      console.log(`URL: /inventario-tic/${inventory?.id}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

fix();
