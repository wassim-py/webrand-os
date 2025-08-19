const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all shipping zones
router.get('/zones', async (req, res) => {
  try {
    const zones = await prisma.shippingZone.findMany({
      orderBy: { wilaya: 'asc' }
    });

    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single shipping zone
router.get('/zones/:wilaya', async (req, res) => {
  try {
    const zone = await prisma.shippingZone.findUnique({
      where: { wilaya: req.params.wilaya }
    });

    if (!zone) {
      return res.status(404).json({ error: 'Shipping zone not found' });
    }

    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new shipping zone
router.post('/zones', async (req, res) => {
  try {
    const { wilaya, stopdeskPrice, domicilePrice } = req.body;

    const zone = await prisma.shippingZone.create({
      data: {
        wilaya,
        stopdeskPrice,
        domicilePrice
      }
    });

    res.status(201).json(zone);
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Shipping zone already exists for this wilaya' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Update shipping zone
router.put('/zones/:wilaya', async (req, res) => {
  try {
    const { stopdeskPrice, domicilePrice } = req.body;

    const zone = await prisma.shippingZone.update({
      where: { wilaya: req.params.wilaya },
      data: {
        stopdeskPrice,
        domicilePrice
      }
    });

    res.json(zone);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete shipping zone
router.delete('/zones/:wilaya', async (req, res) => {
  try {
    // Check if zone is being used by any orders
    const ordersUsingZone = await prisma.order.count({
      where: { wilaya: req.params.wilaya }
    });

    if (ordersUsingZone > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete shipping zone that is being used by existing orders' 
      });
    }

    await prisma.shippingZone.delete({
      where: { wilaya: req.params.wilaya }
    });

    res.json({ message: 'Shipping zone deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Calculate shipping cost
router.post('/calculate', async (req, res) => {
  try {
    const { wilaya, shippingMethod } = req.body;

    const zone = await prisma.shippingZone.findUnique({
      where: { wilaya }
    });

    if (!zone) {
      return res.status(404).json({ error: 'Shipping zone not found' });
    }

    const shippingCost = shippingMethod === 'DOMICILE' 
      ? parseFloat(zone.domicilePrice)
      : parseFloat(zone.stopdeskPrice);

    res.json({
      wilaya,
      shippingMethod,
      shippingCost,
      zone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;