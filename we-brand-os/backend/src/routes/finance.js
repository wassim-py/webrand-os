const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all financial transactions (ledger)
router.get('/ledger', async (req, res) => {
  try {
    const { 
      type, 
      startDate, 
      endDate, 
      search,
      page = 1,
      limit = 50
    } = req.query;
    
    const where = {};
    
    if (type) where.type = type;
    if (search) {
      where.transactionName = { contains: search, mode: 'insensitive' };
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      prisma.financeLedger.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              customerName: true,
              status: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.financeLedger.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single transaction
router.get('/ledger/:id', async (req, res) => {
  try {
    const transaction = await prisma.financeLedger.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
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
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new transaction
router.post('/ledger', async (req, res) => {
  try {
    const {
      transactionName,
      date,
      type,
      moneyIn,
      moneyOut,
      orderId
    } = req.body;

    // Validate that either moneyIn or moneyOut is provided, but not both
    if ((!moneyIn && !moneyOut) || (moneyIn && moneyOut)) {
      return res.status(400).json({ 
        error: 'Either moneyIn or moneyOut must be provided, but not both' 
      });
    }

    const transaction = await prisma.financeLedger.create({
      data: {
        transactionName,
        date: date ? new Date(date) : new Date(),
        type,
        moneyIn: moneyIn ? parseFloat(moneyIn) : null,
        moneyOut: moneyOut ? parseFloat(moneyOut) : null,
        orderId
      },
      include: {
        order: true
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update transaction
router.put('/ledger/:id', async (req, res) => {
  try {
    const {
      transactionName,
      date,
      type,
      moneyIn,
      moneyOut,
      orderId
    } = req.body;

    const transaction = await prisma.financeLedger.update({
      where: { id: req.params.id },
      data: {
        transactionName,
        date: date ? new Date(date) : undefined,
        type,
        moneyIn: moneyIn !== undefined ? (moneyIn ? parseFloat(moneyIn) : null) : undefined,
        moneyOut: moneyOut !== undefined ? (moneyOut ? parseFloat(moneyOut) : null) : undefined,
        orderId
      },
      include: {
        order: true
      }
    });

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete transaction
router.delete('/ledger/:id', async (req, res) => {
  try {
    await prisma.financeLedger.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get financial summary/KPIs
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Get all transactions within date range
    const transactions = await prisma.financeLedger.findMany({
      where: dateFilter
    });

    // Calculate totals by type
    const summary = {
      totalRevenue: 0,
      totalCogs: 0,
      totalMarketingCost: 0,
      totalReturnFees: 0,
      totalCurrencyPurchases: 0,
      totalOtherIncome: 0,
      totalOtherExpenses: 0,
      currentCapital: 0,
      netProfit: 0,
      grossProfit: 0
    };

    transactions.forEach(transaction => {
      const moneyIn = parseFloat(transaction.moneyIn || 0);
      const moneyOut = parseFloat(transaction.moneyOut || 0);

      switch (transaction.type) {
        case 'REVENUE':
          summary.totalRevenue += moneyIn;
          break;
        case 'COGS':
          summary.totalCogs += moneyOut;
          break;
        case 'MARKETING':
          summary.totalMarketingCost += moneyOut;
          break;
        case 'RETURN_FEE':
          summary.totalReturnFees += moneyOut;
          break;
        case 'CURRENCY_PURCHASE':
          summary.totalCurrencyPurchases += moneyOut;
          break;
        case 'OTHER_INCOME':
          summary.totalOtherIncome += moneyIn;
          break;
        case 'OTHER_EXPENSE':
          summary.totalOtherExpenses += moneyOut;
          break;
      }

      // Calculate current capital (running total)
      summary.currentCapital += moneyIn - moneyOut;
    });

    // Calculate derived metrics
    summary.grossProfit = summary.totalRevenue - summary.totalCogs;
    summary.netProfit = summary.grossProfit - summary.totalMarketingCost - 
                       summary.totalReturnFees - summary.totalOtherExpenses + 
                       summary.totalOtherIncome;

    // Get additional metrics
    const additionalMetrics = await calculateAdditionalMetrics(dateFilter);
    
    res.json({
      ...summary,
      ...additionalMetrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate additional business metrics
const calculateAdditionalMetrics = async (dateFilter) => {
  try {
    // Get delivered orders within date range
    const orderDateFilter = {};
    if (dateFilter.date) {
      orderDateFilter.orderDate = dateFilter.date;
    }

    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        ...orderDateFilter
      },
      include: {
        lineItems: {
          include: {
            variant: true
          }
        },
        shippingZone: true
      }
    });

    if (deliveredOrders.length === 0) {
      return {
        averageOrderValue: 0,
        returnRate: 0,
        totalOrders: 0,
        totalOrdersDelivered: 0,
        totalOrdersReturned: 0
      };
    }

    // Calculate average order value
    let totalOrderValue = 0;
    deliveredOrders.forEach(order => {
      const subtotal = order.lineItems.reduce((sum, item) => {
        return sum + (parseFloat(item.actualSalePrice) * item.quantity);
      }, 0);
      
      const shippingPrice = order.shippingMethod === 'DOMICILE' 
        ? parseFloat(order.shippingZone.domicilePrice)
        : parseFloat(order.shippingZone.stopdeskPrice);
      
      const finalPrice = subtotal + shippingPrice - parseFloat(order.discount || 0);
      totalOrderValue += finalPrice;
    });

    const averageOrderValue = totalOrderValue / deliveredOrders.length;

    // Get return statistics
    const [totalOrders, returnedOrders] = await Promise.all([
      prisma.order.count({
        where: {
          status: { in: ['DELIVERED', 'RETURNED'] },
          ...orderDateFilter
        }
      }),
      prisma.order.count({
        where: {
          status: 'RETURNED',
          ...orderDateFilter
        }
      })
    ]);

    const returnRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

    return {
      averageOrderValue,
      returnRate,
      totalOrders,
      totalOrdersDelivered: deliveredOrders.length,
      totalOrdersReturned: returnedOrders
    };
  } catch (error) {
    console.error('Error calculating additional metrics:', error);
    return {
      averageOrderValue: 0,
      returnRate: 0,
      totalOrders: 0,
      totalOrdersDelivered: 0,
      totalOrdersReturned: 0
    };
  }
};

// Get revenue vs profit data for charts
router.get('/charts/revenue-profit', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Get all revenue and expense transactions
    const transactions = await prisma.financeLedger.findMany({
      where: {
        type: { in: ['REVENUE', 'COGS', 'MARKETING', 'RETURN_FEE', 'OTHER_EXPENSE'] },
        ...dateFilter
      },
      orderBy: { date: 'asc' }
    });

    // Group by specified period
    const groupedData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key;
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const week = getWeekNumber(date);
          key = `${date.getFullYear()}-W${week}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, expenses: 0, profit: 0 };
      }

      const moneyIn = parseFloat(transaction.moneyIn || 0);
      const moneyOut = parseFloat(transaction.moneyOut || 0);

      if (transaction.type === 'REVENUE') {
        groupedData[key].revenue += moneyIn;
      } else {
        groupedData[key].expenses += moneyOut;
      }
      
      groupedData[key].profit = groupedData[key].revenue - groupedData[key].expenses;
    });

    // Convert to array and sort by date
    const chartData = Object.entries(groupedData)
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top products by profit
router.get('/charts/top-products', async (req, res) => {
  try {
    const { startDate, endDate, limit = 5 } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) dateFilter.orderDate.gte = new Date(startDate);
      if (endDate) dateFilter.orderDate.lte = new Date(endDate);
    }

    // Get delivered orders with line items
    const orders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        ...dateFilter
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
        }
      }
    });

    // Calculate profit by product
    const productProfits = {};
    
    orders.forEach(order => {
      order.lineItems.forEach(item => {
        const productId = item.variant.productId;
        const productName = item.variant.product.name;
        
        if (!productProfits[productId]) {
          productProfits[productId] = {
            productId,
            productName,
            totalRevenue: 0,
            totalCogs: 0,
            totalProfit: 0,
            totalQuantitySold: 0
          };
        }

        const revenue = parseFloat(item.actualSalePrice) * item.quantity;
        const cogs = parseFloat(item.variant.costPrice) * item.quantity;
        const profit = revenue - cogs;

        productProfits[productId].totalRevenue += revenue;
        productProfits[productId].totalCogs += cogs;
        productProfits[productId].totalProfit += profit;
        productProfits[productId].totalQuantitySold += item.quantity;
      });
    });

    // Convert to array, sort by profit, and limit results
    const topProducts = Object.values(productProfits)
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, parseInt(limit));

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get week number
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Get transaction types for filtering
router.get('/transaction-types', (req, res) => {
  const types = [
    'REVENUE',
    'COGS',
    'MARKETING',
    'RETURN_FEE',
    'CURRENCY_PURCHASE',
    'OTHER_INCOME',
    'OTHER_EXPENSE'
  ];
  
  res.json(types);
});

module.exports = router;