const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create shipping zones (Algerian wilayas)
  const shippingZones = [
    { wilaya: 'Algiers', stopdeskPrice: 400, domicilePrice: 600 },
    { wilaya: 'Oran', stopdeskPrice: 500, domicilePrice: 700 },
    { wilaya: 'Constantine', stopdeskPrice: 450, domicilePrice: 650 },
    { wilaya: 'Annaba', stopdeskPrice: 500, domicilePrice: 700 },
    { wilaya: 'Blida', stopdeskPrice: 400, domicilePrice: 600 },
    { wilaya: 'Batna', stopdeskPrice: 550, domicilePrice: 750 },
    { wilaya: 'Djelfa', stopdeskPrice: 500, domicilePrice: 700 },
    { wilaya: 'Sétif', stopdeskPrice: 450, domicilePrice: 650 },
    { wilaya: 'Sidi Bel Abbès', stopdeskPrice: 550, domicilePrice: 750 },
    { wilaya: 'Biskra', stopdeskPrice: 600, domicilePrice: 800 }
  ];

  console.log('📦 Creating shipping zones...');
  for (const zone of shippingZones) {
    await prisma.shippingZone.upsert({
      where: { wilaya: zone.wilaya },
      update: zone,
      create: zone
    });
  }

  // Create sample products
  console.log('👕 Creating sample products...');
  const products = [
    {
      name: 'Classic T-Shirt',
      category: 'T-Shirts',
      variants: [
        { sku: 'CT-S-BLK', size: 'S', color: 'Black', costPrice: 800, standardSellingPrice: 1500, stockOnHand: 25 },
        { sku: 'CT-M-BLK', size: 'M', color: 'Black', costPrice: 800, standardSellingPrice: 1500, stockOnHand: 30 },
        { sku: 'CT-L-BLK', size: 'L', color: 'Black', costPrice: 800, standardSellingPrice: 1500, stockOnHand: 20 },
        { sku: 'CT-S-WHT', size: 'S', color: 'White', costPrice: 800, standardSellingPrice: 1500, stockOnHand: 15 },
        { sku: 'CT-M-WHT', size: 'M', color: 'White', costPrice: 800, standardSellingPrice: 1500, stockOnHand: 25 },
        { sku: 'CT-L-WHT', size: 'L', color: 'White', costPrice: 800, standardSellingPrice: 1500, stockOnHand: 18 }
      ]
    },
    {
      name: 'Premium Hoodie',
      category: 'Hoodies',
      variants: [
        { sku: 'PH-S-GRY', size: 'S', color: 'Gray', costPrice: 1500, standardSellingPrice: 2800, stockOnHand: 12 },
        { sku: 'PH-M-GRY', size: 'M', color: 'Gray', costPrice: 1500, standardSellingPrice: 2800, stockOnHand: 15 },
        { sku: 'PH-L-GRY', size: 'L', color: 'Gray', costPrice: 1500, standardSellingPrice: 2800, stockOnHand: 10 },
        { sku: 'PH-XL-GRY', size: 'XL', color: 'Gray', costPrice: 1500, standardSellingPrice: 2800, stockOnHand: 8 }
      ]
    },
    {
      name: 'Denim Jacket',
      category: 'Jackets',
      variants: [
        { sku: 'DJ-M-BLU', size: 'M', color: 'Blue', costPrice: 2000, standardSellingPrice: 3500, stockOnHand: 5 },
        { sku: 'DJ-L-BLU', size: 'L', color: 'Blue', costPrice: 2000, standardSellingPrice: 3500, stockOnHand: 7 },
        { sku: 'DJ-XL-BLU', size: 'XL', color: 'Blue', costPrice: 2000, standardSellingPrice: 3500, stockOnHand: 3 }
      ]
    },
    {
      name: 'Sports Shorts',
      category: 'Shorts',
      variants: [
        { sku: 'SS-S-BLK', size: 'S', color: 'Black', costPrice: 600, standardSellingPrice: 1200, stockOnHand: 20 },
        { sku: 'SS-M-BLK', size: 'M', color: 'Black', costPrice: 600, standardSellingPrice: 1200, stockOnHand: 25 },
        { sku: 'SS-L-BLK', size: 'L', color: 'Black', costPrice: 600, standardSellingPrice: 1200, stockOnHand: 15 },
        { sku: 'SS-S-NVY', size: 'S', color: 'Navy', costPrice: 600, standardSellingPrice: 1200, stockOnHand: 18 }
      ]
    }
  ];

  for (const productData of products) {
    const { variants, ...product } = productData;
    
    const createdProduct = await prisma.product.create({
      data: product
    });

    // Create variants
    for (const variant of variants) {
      await prisma.variant.create({
        data: {
          ...variant,
          productId: createdProduct.id
        }
      });

      // Create initial stock history
      if (variant.stockOnHand > 0) {
        await prisma.stockHistory.create({
          data: {
            sku: variant.sku,
            changeType: 'IN',
            quantity: variant.stockOnHand,
            reason: 'Initial stock'
          }
        });
      }
    }
  }

  // Create sample marketing campaigns
  console.log('📈 Creating sample marketing campaigns...');
  const allProducts = await prisma.product.findMany();
  
  const campaigns = [
    {
      campaignName: 'Summer T-Shirt Promo',
      productId: allProducts.find(p => p.name === 'Classic T-Shirt')?.id,
      budgetAllocated: 15000,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      status: 'ENDED'
    },
    {
      campaignName: 'Winter Hoodie Campaign',
      productId: allProducts.find(p => p.name === 'Premium Hoodie')?.id,
      budgetAllocated: 25000,
      startDate: new Date('2024-11-01'),
      endDate: new Date('2025-02-28'),
      status: 'ACTIVE'
    },
    {
      campaignName: 'Denim Collection Launch',
      productId: allProducts.find(p => p.name === 'Denim Jacket')?.id,
      budgetAllocated: 20000,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-05-31'),
      status: 'PENDING'
    }
  ];

  for (const campaign of campaigns) {
    if (campaign.productId) {
      await prisma.marketingCampaign.create({
        data: campaign
      });
    }
  }

  // Create sample orders
  console.log('🛒 Creating sample orders...');
  const sampleOrders = [
    {
      customerName: 'Ahmed Benali',
      phoneNumber: '0555123456',
      address: '123 Rue Didouche Mourad, Algiers',
      wilaya: 'Algiers',
      shippingMethod: 'DOMICILE',
      status: 'DELIVERED',
      discount: 0,
      note: 'First time customer',
      orderDate: new Date('2024-12-01'),
      lineItems: [
        { sku: 'CT-M-BLK', quantity: 2, actualSalePrice: 1500 },
        { sku: 'SS-M-BLK', quantity: 1, actualSalePrice: 1200 }
      ]
    },
    {
      customerName: 'Fatima Khelifi',
      phoneNumber: '0666789012',
      address: '45 Avenue de l\'Indépendance, Oran',
      wilaya: 'Oran',
      shippingMethod: 'STOPDESK',
      status: 'DELIVERED',
      discount: 200,
      note: 'Returning customer - applied discount',
      orderDate: new Date('2024-12-05'),
      lineItems: [
        { sku: 'PH-M-GRY', quantity: 1, actualSalePrice: 2800 }
      ]
    },
    {
      customerName: 'Karim Messaoud',
      phoneNumber: '0777345678',
      address: '78 Rue Larbi Ben M\'hidi, Constantine',
      wilaya: 'Constantine',
      shippingMethod: 'DOMICILE',
      status: 'SHIPPED',
      discount: 0,
      note: '',
      orderDate: new Date('2024-12-10'),
      lineItems: [
        { sku: 'CT-L-WHT', quantity: 1, actualSalePrice: 1500 },
        { sku: 'SS-L-BLK', quantity: 2, actualSalePrice: 1200 }
      ]
    },
    {
      customerName: 'Amina Boudiaf',
      phoneNumber: '0555987654',
      address: '12 Place du 1er Mai, Annaba',
      wilaya: 'Annaba',
      shippingMethod: 'DOMICILE',
      status: 'NEW',
      discount: 0,
      note: 'Please call before delivery',
      orderDate: new Date('2024-12-15'),
      lineItems: [
        { sku: 'DJ-L-BLU', quantity: 1, actualSalePrice: 3500 }
      ]
    }
  ];

  for (const orderData of sampleOrders) {
    const { lineItems, orderDate, ...order } = orderData;
    
    const createdOrder = await prisma.order.create({
      data: {
        ...order,
        orderDate
      }
    });

    // Create line items
    for (const item of lineItems) {
      await prisma.orderLineItem.create({
        data: {
          orderId: createdOrder.id,
          sku: item.sku,
          quantity: item.quantity,
          actualSalePrice: item.actualSalePrice
        }
      });

      // Update stock if order is not cancelled
      if (order.status !== 'CANCELLED') {
        const variant = await prisma.variant.findUnique({
          where: { sku: item.sku }
        });

        if (variant) {
          const newStock = order.status === 'RETURNED' 
            ? variant.stockOnHand // Stock already returned
            : variant.stockOnHand - item.quantity;

          await prisma.variant.update({
            where: { sku: item.sku },
            data: { stockOnHand: Math.max(0, newStock) }
          });

          // Create stock history
          await prisma.stockHistory.create({
            data: {
              sku: item.sku,
              changeType: order.status === 'RETURNED' ? 'IN' : 'OUT',
              quantity: item.quantity,
              reason: order.status === 'RETURNED' ? 'Order returned' : 'Order created',
              orderId: createdOrder.id
            }
          });
        }
      }
    }

    // Create financial transactions for delivered orders
    if (order.status === 'DELIVERED') {
      const shippingZone = await prisma.shippingZone.findUnique({
        where: { wilaya: order.wilaya }
      });

      const subtotal = lineItems.reduce((sum, item) => {
        return sum + (item.actualSalePrice * item.quantity);
      }, 0);

      const shippingPrice = order.shippingMethod === 'DOMICILE' 
        ? parseFloat(shippingZone.domicilePrice)
        : parseFloat(shippingZone.stopdeskPrice);

      const finalPrice = subtotal + shippingPrice - order.discount;

      // Revenue transaction
      await prisma.financeLedger.create({
        data: {
          transactionName: `Revenue from order ${createdOrder.id}`,
          type: 'REVENUE',
          moneyIn: finalPrice,
          orderId: createdOrder.id,
          date: orderDate
        }
      });

      // COGS transaction
      const totalCogs = await Promise.all(
        lineItems.map(async (item) => {
          const variant = await prisma.variant.findUnique({
            where: { sku: item.sku }
          });
          return parseFloat(variant.costPrice) * item.quantity;
        })
      );

      const sumCogs = totalCogs.reduce((sum, cogs) => sum + cogs, 0);

      await prisma.financeLedger.create({
        data: {
          transactionName: `COGS for order ${createdOrder.id}`,
          type: 'COGS',
          moneyOut: sumCogs,
          orderId: createdOrder.id,
          date: orderDate
        }
      });

      // Marketing allocation (10% of revenue)
      const marketingAllocation = finalPrice * 0.1;
      await prisma.financeLedger.create({
        data: {
          transactionName: `Marketing allocation for order ${createdOrder.id}`,
          type: 'MARKETING',
          moneyOut: marketingAllocation,
          orderId: createdOrder.id,
          date: orderDate
        }
      });
    }
  }

  // Create some additional financial transactions
  console.log('💰 Creating additional financial transactions...');
  const additionalTransactions = [
    {
      transactionName: 'Initial capital investment',
      type: 'OTHER_INCOME',
      moneyIn: 100000,
      date: new Date('2024-01-01')
    },
    {
      transactionName: 'Facebook Ads - December',
      type: 'MARKETING',
      moneyOut: 8000,
      date: new Date('2024-12-01')
    },
    {
      transactionName: 'Instagram Ads - December',
      type: 'MARKETING',
      moneyOut: 5000,
      date: new Date('2024-12-01')
    },
    {
      transactionName: 'USD Currency Purchase',
      type: 'CURRENCY_PURCHASE',
      moneyOut: 15000,
      date: new Date('2024-11-15')
    },
    {
      transactionName: 'Office rent - December',
      type: 'OTHER_EXPENSE',
      moneyOut: 25000,
      date: new Date('2024-12-01')
    }
  ];

  for (const transaction of additionalTransactions) {
    await prisma.financeLedger.create({
      data: transaction
    });
  }

  // Create currency purchases
  console.log('💱 Creating currency purchases...');
  const currencyPurchases = [
    {
      purchaseDate: new Date('2024-11-15'),
      currency: 'USD',
      amountBought: 100,
      exchangeRatePaid: 150
    },
    {
      purchaseDate: new Date('2024-10-01'),
      currency: 'EUR',
      amountBought: 80,
      exchangeRatePaid: 165
    }
  ];

  for (const purchase of currencyPurchases) {
    await prisma.currencyPurchase.create({
      data: purchase
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - ${shippingZones.length} shipping zones created`);
  console.log(`   - ${products.length} products created with variants`);
  console.log(`   - ${campaigns.length} marketing campaigns created`);
  console.log(`   - ${sampleOrders.length} sample orders created`);
  console.log(`   - ${additionalTransactions.length} additional financial transactions created`);
  console.log(`   - ${currencyPurchases.length} currency purchases created`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });