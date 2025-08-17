import { Router } from 'express';
import * as marketingController from '../controllers/marketing.controller';

const router = Router();

// Marketing Campaigns
router.get('/campaigns', marketingController.getAllCampaigns);
router.post('/campaigns', marketingController.createCampaign);

// Currency Purchases
router.get('/currency-purchases', marketingController.getAllCurrencyPurchases);
router.post('/currency-purchases', marketingController.createCurrencyPurchase);

// Finances Ledger
router.get('/ledger', marketingController.getFinancesLedger);

export default router;
