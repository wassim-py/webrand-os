import { Router } from 'express';
import productRoutes from './products.routes';
import orderRoutes from './orders.routes';
import marketingRoutes from './marketing.routes';
import shippingRoutes from './shipping.routes';
import dashboardRoutes from './dashboard.routes';
import authRoutes from './auth.routes';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use('/auth', authRoutes);

// All routes below this will be protected
router.use(protect);

router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/marketing', marketingRoutes);
router.use('/shipping-zones', shippingRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
