import { Router } from 'express';
import productRoutes from './products.routes';
import orderRoutes from './orders.routes';
import marketingRoutes from './marketing.routes';

const router = Router();

router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/marketing', marketingRoutes);

export default router;
