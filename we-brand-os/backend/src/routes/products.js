const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all products with variants
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    
    const where = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        _count: {
          select: { variants: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product with variants
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        variants: {
          include: {
            stockHistory: {
              orderBy: { createdAt: 'desc' },
              take: 10
            }
          }
        },
        marketingCampaigns: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const { name, category, variants = [] } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        category,
        variants: {
          create: variants.map(variant => ({
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            costPrice: variant.costPrice,
            standardSellingPrice: variant.standardSellingPrice,
            stockOnHand: variant.stockOnHand || 0
          }))
        }
      },
      include: {
        variants: true
      }
    });

    // Create stock history entries for initial stock
    if (variants.length > 0) {
      const stockHistoryEntries = variants
        .filter(v => v.stockOnHand > 0)
        .map(variant => ({
          sku: variant.sku,
          changeType: 'IN',
          quantity: variant.stockOnHand,
          reason: 'Initial stock'
        }));

      if (stockHistoryEntries.length > 0) {
        await prisma.stockHistory.createMany({
          data: stockHistoryEntries
        });
      }
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { name, category } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, category },
      include: {
        variants: true
      }
    });

    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all variants
router.get('/variants/all', async (req, res) => {
  try {
    const { search, lowStock } = req.query;
    
    const where = {};
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (lowStock === 'true') {
      where.stockOnHand = { lte: 10 }; // Consider low stock as <= 10
    }

    const variants = await prisma.variant.findMany({
      where,
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(variants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create variant
router.post('/variants', async (req, res) => {
  try {
    const { sku, productId, size, color, costPrice, standardSellingPrice, stockOnHand = 0 } = req.body;

    const variant = await prisma.variant.create({
      data: {
        sku,
        productId,
        size,
        color,
        costPrice,
        standardSellingPrice,
        stockOnHand
      },
      include: {
        product: true
      }
    });

    // Create stock history entry if there's initial stock
    if (stockOnHand > 0) {
      await prisma.stockHistory.create({
        data: {
          sku,
          changeType: 'IN',
          quantity: stockOnHand,
          reason: 'Initial stock'
        }
      });
    }

    res.status(201).json(variant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update variant
router.put('/variants/:sku', async (req, res) => {
  try {
    const { size, color, costPrice, standardSellingPrice, stockOnHand } = req.body;
    const sku = req.params.sku;

    // Get current variant to check stock changes
    const currentVariant = await prisma.variant.findUnique({
      where: { sku }
    });

    if (!currentVariant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const variant = await prisma.variant.update({
      where: { sku },
      data: {
        size,
        color,
        costPrice,
        standardSellingPrice,
        stockOnHand
      },
      include: {
        product: true
      }
    });

    // Create stock history entry if stock changed
    if (stockOnHand !== undefined && stockOnHand !== currentVariant.stockOnHand) {
      const difference = stockOnHand - currentVariant.stockOnHand;
      await prisma.stockHistory.create({
        data: {
          sku,
          changeType: difference > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(difference),
          reason: 'Manual adjustment'
        }
      });
    }

    res.json(variant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete variant
router.delete('/variants/:sku', async (req, res) => {
  try {
    await prisma.variant.delete({
      where: { sku: req.params.sku }
    });

    res.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get variant stock history
router.get('/variants/:sku/history', async (req, res) => {
  try {
    const history = await prisma.stockHistory.findMany({
      where: { sku: req.params.sku },
      orderBy: { createdAt: 'desc' }
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;