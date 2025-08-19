const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all marketing campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const { status, productId, search } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (search) {
      where.campaignName = { contains: search, mode: 'insensitive' };
    }

    const campaigns = await prisma.marketingCampaign.findMany({
      where,
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single campaign
router.get('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: req.params.id },
      include: {
        product: {
          include: {
            variants: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Calculate campaign performance metrics
    const performance = await calculateCampaignPerformance(campaign);

    res.json({
      ...campaign,
      performance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Calculate campaign performance
const calculateCampaignPerformance = async (campaign) => {
  try {
    // Get all orders for products in this campaign within campaign period
    const orders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        orderDate: {
          gte: campaign.startDate,
          lte: campaign.endDate || new Date()
        },
        lineItems: {
          some: {
            variant: {
              productId: campaign.productId
            }
          }
        }
      },
      include: {
        lineItems: {
          where: {
            variant: {
              productId: campaign.productId
            }
          },
          include: {
            variant: true
          }
        }
      }
    });

    const totalSales = orders.length;
    const totalRevenue = orders.reduce((sum, order) => {
      const campaignRevenue = order.lineItems.reduce((itemSum, item) => {
        return itemSum + (parseFloat(item.actualSalePrice) * item.quantity);
      }, 0);
      return sum + campaignRevenue;
    }, 0);

    const averageMarketingCostPerSale = totalSales > 0 
      ? parseFloat(campaign.budgetAllocated) / totalSales 
      : 0;

    const roi = totalRevenue > 0 
      ? ((totalRevenue - parseFloat(campaign.budgetAllocated)) / parseFloat(campaign.budgetAllocated)) * 100 
      : 0;

    return {
      totalSales,
      totalRevenue,
      averageMarketingCostPerSale,
      roi,
      budgetSpent: parseFloat(campaign.budgetAllocated),
      budgetRemaining: Math.max(0, parseFloat(campaign.budgetAllocated) - parseFloat(campaign.budgetAllocated))
    };
  } catch (error) {
    console.error('Error calculating campaign performance:', error);
    return {
      totalSales: 0,
      totalRevenue: 0,
      averageMarketingCostPerSale: 0,
      roi: 0,
      budgetSpent: 0,
      budgetRemaining: parseFloat(campaign.budgetAllocated)
    };
  }
};

// Create new campaign
router.post('/campaigns', async (req, res) => {
  try {
    const {
      campaignName,
      productId,
      budgetAllocated,
      startDate,
      endDate,
      status = 'PENDING'
    } = req.body;

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(400).json({ error: 'Product not found' });
    }

    // Auto-set status based on dates
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    let autoStatus = status;
    if (start > now) {
      autoStatus = 'PENDING';
    } else if (end && end < now) {
      autoStatus = 'ENDED';
    } else if (start <= now && (!end || end >= now)) {
      autoStatus = 'ACTIVE';
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        campaignName,
        productId,
        budgetAllocated,
        startDate: start,
        endDate: end,
        status: autoStatus
      },
      include: {
        product: true
      }
    });

    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update campaign
router.put('/campaigns/:id', async (req, res) => {
  try {
    const {
      campaignName,
      productId,
      budgetAllocated,
      startDate,
      endDate,
      status
    } = req.body;

    const campaign = await prisma.marketingCampaign.update({
      where: { id: req.params.id },
      data: {
        campaignName,
        productId,
        budgetAllocated,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status
      },
      include: {
        product: true
      }
    });

    res.json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete campaign
router.delete('/campaigns/:id', async (req, res) => {
  try {
    await prisma.marketingCampaign.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all currency purchases
router.get('/currency', async (req, res) => {
  try {
    const { currency, startDate, endDate } = req.query;
    
    const where = {};
    if (currency) where.currency = currency;
    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate);
      if (endDate) where.purchaseDate.lte = new Date(endDate);
    }

    const purchases = await prisma.currencyPurchase.findMany({
      where,
      orderBy: { purchaseDate: 'desc' }
    });

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single currency purchase
router.get('/currency/:id', async (req, res) => {
  try {
    const purchase = await prisma.currencyPurchase.findUnique({
      where: { id: req.params.id }
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Currency purchase not found' });
    }

    res.json(purchase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new currency purchase
router.post('/currency', async (req, res) => {
  try {
    const {
      purchaseDate,
      currency,
      amountBought,
      exchangeRatePaid
    } = req.body;

    const purchase = await prisma.currencyPurchase.create({
      data: {
        purchaseDate: new Date(purchaseDate),
        currency,
        amountBought,
        exchangeRatePaid
      }
    });

    // Create corresponding finance transaction
    const totalCost = parseFloat(amountBought) * parseFloat(exchangeRatePaid);
    await prisma.financeLedger.create({
      data: {
        transactionName: `Currency purchase: ${amountBought} ${currency}`,
        type: 'CURRENCY_PURCHASE',
        moneyOut: totalCost,
        date: new Date(purchaseDate)
      }
    });

    res.status(201).json(purchase);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update currency purchase
router.put('/currency/:id', async (req, res) => {
  try {
    const {
      purchaseDate,
      currency,
      amountBought,
      exchangeRatePaid
    } = req.body;

    const purchase = await prisma.currencyPurchase.update({
      where: { id: req.params.id },
      data: {
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        currency,
        amountBought,
        exchangeRatePaid
      }
    });

    res.json(purchase);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete currency purchase
router.delete('/currency/:id', async (req, res) => {
  try {
    await prisma.currencyPurchase.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Currency purchase deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get marketing analytics
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Get marketing spend
    const marketingTransactions = await prisma.financeLedger.findMany({
      where: {
        type: 'MARKETING',
        ...dateFilter
      }
    });

    const totalMarketingSpend = marketingTransactions.reduce((sum, t) => 
      sum + parseFloat(t.moneyOut || 0), 0);

    // Get campaign statistics
    const campaignStats = await prisma.marketingCampaign.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        budgetAllocated: true
      }
    });

    // Get top performing campaigns
    const campaigns = await prisma.marketingCampaign.findMany({
      include: {
        product: true
      }
    });

    const campaignPerformance = await Promise.all(
      campaigns.map(async (campaign) => {
        const performance = await calculateCampaignPerformance(campaign);
        return {
          ...campaign,
          performance
        };
      })
    );

    // Sort by ROI
    const topCampaigns = campaignPerformance
      .sort((a, b) => b.performance.roi - a.performance.roi)
      .slice(0, 5);

    res.json({
      totalMarketingSpend,
      campaignStats,
      topCampaigns,
      totalCampaigns: campaigns.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update campaign statuses based on dates (utility endpoint)
router.post('/campaigns/update-statuses', async (req, res) => {
  try {
    const now = new Date();
    
    // Update pending campaigns that should be active
    await prisma.marketingCampaign.updateMany({
      where: {
        status: 'PENDING',
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      data: { status: 'ACTIVE' }
    });

    // Update active campaigns that should be ended
    await prisma.marketingCampaign.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now }
      },
      data: { status: 'ENDED' }
    });

    const updatedCampaigns = await prisma.marketingCampaign.findMany({
      include: { product: true }
    });

    res.json({
      message: 'Campaign statuses updated successfully',
      campaigns: updatedCampaigns
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;