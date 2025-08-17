import { Router } from 'express';
import * as productController from '../controllers/product.controller';

const router = Router();

router.get('/', productController.getAllVariants);
router.post('/', productController.createProduct);
router.get('/:sku', productController.getVariantBySku);
router.put('/:sku', productController.updateVariant);
router.delete('/:sku', productController.deleteVariant);

export default router;
