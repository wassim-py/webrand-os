const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard overview with KPIs
router.get('/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Get financial summary
    const transactions = await prisma.financeLedger.findMany({
      where: dateFilter
    });

    // Calculate KPIs
    const kpis = {
      currentCapital: 0,
      totalRevenue: 0,
      totalCogs: 0,
      totalMarketingCost: 0,
      totalReturnFees: 0,
      grossProfit: 0,
      netProfit: 0,
      averageOrderValue: 0,
      returnRate: 0
    };

    transactions.forEach(transaction => {
      const moneyIn = parseFloat(transaction.moneyIn || 0);
      const moneyOut = parseFloat(transaction.moneyOut || 0);

      kpis.currentCapital += moneyIn - moneyOut;

      switch (transaction.type) {
        case 'REVENUE':
          kpis.totalRevenue += moneyIn;
          break;
        case 'COGS':
          kpis.totalCogs += moneyOut;
          break;
        case 'MARKETING':
          kpis.totalMarketingCost += moneyOut;
          break;
        case 'RETURN_FEE':
          kpis.totalReturnFees += moneyOut;
          break;
      }
    });

    kpis.grossProfit = kpis.totalRevenue - kpis.totalCogs;
    kpis.netProfit = kpis.grossProfit - kpis.totalMarketingCost - kpis.totalReturnFees;

    // Calculate average order value and return rate
    const orderDateFilter = {};
    if (startDate || endDate) {
      orderDateFilter.orderDate = {};
      if (startDate) orderDateFilter.orderDate.gte = new Date(startDate);
      if (endDate) orderDateFilter.orderDate.lte = new Date(endDate);
    }

    const [deliveredOrders, totalOrders, returnedOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          ...orderDateFilter
        },
        include: {
          lineItems: true,
          shippingZone: true
        }
      }),
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

    if (deliveredOrders.length > 0) {
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

      kpis.averageOrderValue = totalOrderValue / deliveredOrders.length;
    }

    kpis.returnRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

    res.json({ kpis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue vs profit chart data
router.get('/charts/revenue-profit', async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    const transactions = await prisma.financeLedger.findMany({
      where: {
        type: { in: ['REVENUE', 'COGS', 'MARKETING', 'RETURN_FEE'] },
        ...dateFilter
      },
      orderBy: { date: 'asc' }
    });

    // Group data by period
    const groupedData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key;
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, profit: 0, expenses: 0 };
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

    const chartData = Object.entries(groupedData)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        profit: data.profit
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top 5 best-selling products by net profit
router.get('/charts/top-products', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) dateFilter.orderDate.gte = new Date(startDate);
      if (endDate) dateFilter.orderDate.lte = new Date(endDate);
    }

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
            netProfit: 0,
            quantitySold: 0
          };
        }

        const revenue = parseFloat(item.actualSalePrice) * item.quantity;
        const cogs = parseFloat(item.variant.costPrice) * item.quantity;
        const profit = revenue - cogs;

        productProfits[productId].totalRevenue += revenue;
        productProfits[productId].totalCogs += cogs;
        productProfits[productId].netProfit += profit;
        productProfits[productId].quantitySold += item.quantity;
      });
    });

    // Get top 5 by net profit
    const topProducts = Object.values(productProfits)
      .sort((a, b) => b.netProfit - a.netProfit)
      .slice(0, 5);

    res.json(topProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent orders
router.get('/recent-orders', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentOrders = await prisma.order.findMany({
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
      orderBy: { orderDate: 'desc' },
      take: parseInt(limit)
    });

    // Calculate totals for each order
    const ordersWithTotals = recentOrders.map(order => {
      const subtotal = order.lineItems.reduce((sum, item) => {
        return sum + (parseFloat(item.actualSalePrice) * item.quantity);
      }, 0);

      const shippingPrice = order.shippingMethod === 'DOMICILE' 
        ? parseFloat(order.shippingZone.domicilePrice)
        : parseFloat(order.shippingZone.stopdeskPrice);

      const finalPrice = subtotal + shippingPrice - parseFloat(order.discount || 0);

      return {
        ...order,
        subtotal,
        shippingPrice,
        finalPrice: Math.max(0, finalPrice)
      };
    });

    res.json(ordersWithTotals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    
    const lowStockItems = await prisma.variant.findMany({
      where: {
        stockOnHand: {
          lte: parseInt(threshold)
        }
      },
      include: {
        product: true
      },
      orderBy: { stockOnHand: 'asc' }
    });

    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order statistics
router.get('/order-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) dateFilter.orderDate.gte = new Date(startDate);
      if (endDate) dateFilter.orderDate.lte = new Date(endDate);
    }

    const [ordersByStatus, totalOrders] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: true
      }),
      prisma.order.count({ where: dateFilter })
    ]);

    const stats = {
      totalOrders,
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      statusDistribution: ordersByStatus.map(item => ({
        status: item.status,
        count: item._count,
        percentage: totalOrders > 0 ? (item._count / totalOrders) * 100 : 0
      }))
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get marketing performance summary
router.get('/marketing-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.startDate = {};
      if (startDate) dateFilter.startDate.gte = new Date(startDate);
      if (endDate) dateFilter.startDate.lte = new Date(endDate);
    }

    const [activeCampaigns, totalCampaigns, marketingSpend] = await Promise.all([
      prisma.marketingCampaign.count({
        where: {
          status: 'ACTIVE',
          ...dateFilter
        }
      }),
      prisma.marketingCampaign.count({ where: dateFilter }),
      prisma.financeLedger.aggregate({
        where: {
          type: 'MARKETING',
          date: dateFilter.startDate || {}
        },
        _sum: {
          moneyOut: true
        }
      })
    ]);

    res.json({
      activeCampaigns,
      totalCampaigns,
      totalMarketingSpend: parseFloat(marketingSpend._sum.moneyOut || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;