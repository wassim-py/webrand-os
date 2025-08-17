import { Router } from 'express';
import * as shippingController from '../controllers/shipping.controller';

const router = Router();

router.get('/', shippingController.getAllShippingZones);

export default router;
