import { prisma } from '../../src/utils/prisma.js';

async function main() {
  const zones = [
    { wilaya: 'Algiers', stopdeskPrice: 300, domicilePrice: 500 },
    { wilaya: 'Oran', stopdeskPrice: 350, domicilePrice: 550 },
    { wilaya: 'Constantine', stopdeskPrice: 400, domicilePrice: 600 }
  ];
  for (const z of zones) {
    await prisma.shippingZone.upsert({
      where: { wilaya: z.wilaya },
      update: z as any,
      create: z as any
    });
  }
  console.log('Seeded shipping zones');
}

main().finally(() => prisma.$disconnect());