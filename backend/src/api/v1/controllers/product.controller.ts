import { Request, Response } from 'express';
import * as productService from '../services/product.service';

export const getAllVariants = async (req: Request, res: Response) => {
  try {
    const variants = await productService.getAllVariants();
    res.status(200).json(variants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching variants', error });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { productData, variantsData } = req.body;
    if (!productData || !variantsData) {
        return res.status(400).json({ message: 'Missing product or variant data' });
    }
    const newProduct = await productService.createProductWithVariants(productData, variantsData);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error });
  }
};

export const getVariantBySku = async (req: Request, res: Response) => {
  try {
    const { sku } = req.params;
    const variant = await productService.getVariantBySku(sku);
    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }
    res.status(200).json(variant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching variant', error });
  }
};

export const updateVariant = async (req: Request, res: Response) => {
    try {
        const { sku } = req.params;
        const updatedVariant = await productService.updateVariant(sku, req.body);
        res.status(200).json(updatedVariant);
    } catch (error) {
        res.status(500).json({ message: 'Error updating variant', error });
    }
};

export const deleteVariant = async (req: Request, res: Response) => {
    try {
        const { sku } = req.params;
        await productService.deleteVariant(sku);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting variant', error });
    }
};
