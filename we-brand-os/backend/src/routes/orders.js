const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Helper function to calculate order totals
const calculateOrderTotals = async (lineItems, wilaya, shippingMethod, discount = 0) => {
  const shippingZone = await prisma.shippingZone.findUnique({
    where: { wilaya }
  });

  if (!shippingZone) {
    throw new Error('Invalid shipping zone');
  }

  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.actualSalePrice) * item.quantity);
  }, 0);

  const shippingPrice = shippingMethod === 'DOMICILE' 
    ? parseFloat(shippingZone.domicilePrice)
    : parseFloat(shippingZone.stopdeskPrice);

  const finalPrice = subtotal + shippingPrice - parseFloat(discount);

  return {
    subtotal,
    shippingPrice,
    finalPrice: Math.max(0, finalPrice) // Ensure non-negative
  };
};

// Helper function to update stock levels
const updateStockLevels = async (lineItems, operation) => {
  for (const item of lineItems) {
    const variant = await prisma.variant.findUnique({
      where: { sku: item.sku }
    });

    if (!variant) {
      throw new Error(`Variant with SKU ${item.sku} not found`);
    }

    const stockChange = operation === 'COMMIT' ? -item.quantity : item.quantity;
    const newStock = variant.stockOnHand + stockChange;

    if (operation === 'COMMIT' && newStock < 0) {
      throw new Error(`Insufficient stock for SKU ${item.sku}. Available: ${variant.stockOnHand}, Required: ${item.quantity}`);
    }

    await prisma.variant.update({
      where: { sku: item.sku },
      data: { stockOnHand: newStock }
    });

    // Create stock history entry
    await prisma.stockHistory.create({
      data: {
        sku: item.sku,
        changeType: operation === 'COMMIT' ? 'OUT' : 'IN',
        quantity: item.quantity,
        reason: operation === 'COMMIT' ? 'Order created' : 'Order cancelled/returned',
        orderId: null // Will be updated after order creation
      }
    });
  }
};

// Get all orders
router.get('/', async (req, res) => {
  try {
    const { search, status, startDate, endDate } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate);
      if (endDate) where.orderDate.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        lineItems: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        },
        shippingZone: true
      },
      orderBy: { orderDate: 'desc' }
    });

    // Calculate totals for each order
    const ordersWithTotals = await Promise.all(orders.map(async (order) => {
      const totals = await calculateOrderTotals(
        order.lineItems,
        order.wilaya,
        order.shippingMethod,
        order.discount || 0
      );
      
      return {
        ...order,
        ...totals
      };
    }));

    res.json(ordersWithTotals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        lineItems: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        },
        shippingZone: true,
        transactions: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Calculate totals
    const totals = await calculateOrderTotals(
      order.lineItems,
      order.wilaya,
      order.shippingMethod,
      order.discount || 0
    );

    res.json({
      ...order,
      ...totals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      phoneNumber,
      address,
      wilaya,
      shippingMethod,
      discount = 0,
      note,
      lineItems
    } = req.body;

    // Validate line items
    if (!lineItems || lineItems.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one line item' });
    }

    // Check stock availability before creating order
    for (const item of lineItems) {
      const variant = await prisma.variant.findUnique({
        where: { sku: item.sku }
      });

      if (!variant) {
        return res.status(400).json({ error: `Variant with SKU ${item.sku} not found` });
      }

      if (variant.stockOnHand < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for SKU ${item.sku}. Available: ${variant.stockOnHand}, Required: ${item.quantity}` 
        });
      }
    }

    // Create order with line items
    const order = await prisma.order.create({
      data: {
        customerName,
        phoneNumber,
        address,
        wilaya,
        shippingMethod,
        discount,
        note,
        lineItems: {
          create: lineItems.map(item => ({
            sku: item.sku,
            quantity: item.quantity,
            actualSalePrice: item.actualSalePrice
          }))
        }
      },
      include: {
        lineItems: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        },
        shippingZone: true
      }
    });

    // Update stock levels and create stock history
    await updateStockLevels(lineItems, 'COMMIT');

    // Update stock history with order ID
    await prisma.stockHistory.updateMany({
      where: {
        sku: { in: lineItems.map(item => item.sku) },
        orderId: null,
        reason: 'Order created'
      },
      data: { orderId: order.id }
    });

    // Calculate totals
    const totals = await calculateOrderTotals(
      order.lineItems,
      order.wilaya,
      order.shippingMethod,
      order.discount || 0
    );

    res.status(201).json({
      ...order,
      ...totals
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update order
router.put('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const {
      customerName,
      phoneNumber,
      address,
      wilaya,
      shippingMethod,
      discount,
      note,
      status
    } = req.body;

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        lineItems: true
      }
    });

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Handle status changes that affect stock and finances
    if (status && status !== currentOrder.status) {
      await handleStatusChange(currentOrder, status);
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        customerName,
        phoneNumber,
        address,
        wilaya,
        shippingMethod,
        discount,
        note,
        status
      },
      include: {
        lineItems: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        },
        shippingZone: true
      }
    });

    // Calculate totals
    const totals = await calculateOrderTotals(
      order.lineItems,
      order.wilaya,
      order.shippingMethod,
      order.discount || 0
    );

    res.json({
      ...order,
      ...totals
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Handle order status changes
const handleStatusChange = async (order, newStatus) => {
  const oldStatus = order.status;

  if (oldStatus === 'NEW' && newStatus === 'CANCELLED') {
    // Return stock to inventory
    await updateStockLevels(order.lineItems, 'RETURN');
  } else if (oldStatus === 'DELIVERED' && newStatus === 'RETURNED') {
    // Return stock and create return fee transaction
    await updateStockLevels(order.lineItems, 'RETURN');
    
    // Create return fee transaction (assuming 500 DZD return fee)
    await prisma.financeLedger.create({
      data: {
        transactionName: `Return fee for order ${order.id}`,
        type: 'RETURN_FEE',
        moneyOut: 500,
        orderId: order.id
      }
    });
  } else if (oldStatus === 'SHIPPED' && newStatus === 'DELIVERED') {
    // Generate financial transactions
    await generateFinancialTransactions(order);
  }
};

// Generate financial transactions for delivered orders
const generateFinancialTransactions = async (order) => {
  const totals = await calculateOrderTotals(
    order.lineItems,
    order.wilaya,
    order.shippingMethod,
    order.discount || 0
  );

  // Revenue transaction
  await prisma.financeLedger.create({
    data: {
      transactionName: `Revenue from order ${order.id}`,
      type: 'REVENUE',
      moneyIn: totals.finalPrice,
      orderId: order.id
    }
  });

  // COGS transaction
  const totalCogs = order.lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.variant.costPrice) * item.quantity);
  }, 0);

  await prisma.financeLedger.create({
    data: {
      transactionName: `COGS for order ${order.id}`,
      type: 'COGS',
      moneyOut: totalCogs,
      orderId: order.id
    }
  });

  // Marketing allocation (simplified - could be more sophisticated)
  const marketingAllocation = totals.finalPrice * 0.1; // 10% of revenue for marketing
  await prisma.financeLedger.create({
    data: {
      transactionName: `Marketing allocation for order ${order.id}`,
      type: 'MARKETING',
      moneyOut: marketingAllocation,
      orderId: order.id
    }
  });
};

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { lineItems: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If order is NEW, return stock to inventory
    if (order.status === 'NEW') {
      await updateStockLevels(order.lineItems, 'RETURN');
    }

    await prisma.order.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get order statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) dateFilter.orderDate.gte = new Date(startDate);
      if (endDate) dateFilter.orderDate.lte = new Date(endDate);
    }

    const stats = await Promise.all([
      // Total orders
      prisma.order.count({ where: dateFilter }),
      
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: true
      }),
      
      // Recent orders
      prisma.order.findMany({
        where: dateFilter,
        include: {
          lineItems: {
            include: {
              variant: {
                include: {
                  product: true
                }
              }
            }
          }
        },
        orderBy: { orderDate: 'desc' },
        take: 10
      })
    ]);

    res.json({
      totalOrders: stats[0],
      ordersByStatus: stats[1],
      recentOrders: stats[2]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;