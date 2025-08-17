import prisma from '../../../config/db';
import { Prisma } from '@prisma/client';

// Using Prisma's generated types for better type safety
type ProductCreateInput = Prisma.ProductCreateInput;
type VariantCreateInput = Prisma.VariantCreateInput;

export const getAllVariants = async () => {
  return prisma.variant.findMany({
    include: {
      product: true,
    },
  });
};

export const createProductWithVariants = async (productData: { name: string, category: string }, variantsData: VariantCreateInput[]) => {
  // Prisma's nested create will handle this transactionally
  const product = await prisma.product.create({
    data: {
      name: productData.name,
      category: productData.category,
      variants: {
        create: variantsData,
      },
    },
    include: {
      variants: true,
    },
  });
  return product;
};

export const getVariantBySku = async (sku: string) => {
  return prisma.variant.findUnique({
    where: { sku },
    include: { product: true },
  });
};

export const updateVariant = async (sku: string, data: Prisma.VariantUpdateInput) => {
    return prisma.variant.update({
        where: { sku },
        data,
        include: { product: true },
    });
};

export const deleteVariant = async (sku: string) => {
    // This is a simple delete. A real-world app might soft-delete instead.
    return prisma.variant.delete({
        where: { sku },
    });
};
