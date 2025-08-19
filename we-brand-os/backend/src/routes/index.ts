import { Router } from 'express';
import productsRouter from './products.js';
import variantsRouter from './variants.js';
import ordersRouter from './orders.js';
import shippingRouter from './shipping.js';
import campaignsRouter from './campaigns.js';
import currencyRouter from './currency.js';
import ledgerRouter from './ledger.js';
import kpisRouter from './kpis.js';

export const router = Router();

router.use('/products', productsRouter);
router.use('/variants', variantsRouter);
router.use('/orders', ordersRouter);
router.use('/shipping-zones', shippingRouter);
router.use('/campaigns', campaignsRouter);
router.use('/currency-purchases', currencyRouter);
router.use('/ledger', ledgerRouter);
router.use('/kpis', kpisRouter);
