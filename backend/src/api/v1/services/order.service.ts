import prisma from '../../../config/db';
import { OrderStatus, Prisma } from '@prisma/client';

// A type for the line items when creating an order
interface OrderLineItemInput {
  sku: string;
  quantity: number;
  actualSalePrice: number;
}

export const getAllOrders = async () => {
  return prisma.order.findMany({
    include: {
      lineItems: {
        include: {
          variant: true,
        },
      },
      shippingZone: true,
    },
    orderBy: {
      orderDate: 'desc',
    },
  });
};

export const getOrderById = async (orderId: string) => {
    return prisma.order.findUnique({
        where: { id: orderId },
        include: {
            lineItems: {
                include: {
                    variant: { include: { product: true } }
                }
            },
            shippingZone: true
        }
    });
};

export const createOrder = async (orderData: Omit<Prisma.OrderCreateInput, 'lineItems'>, lineItems: OrderLineItemInput[]) => {
  return prisma.$transaction(async (tx) => {
    // 1. Decrement stock for each line item
    for (const item of lineItems) {
      const updatedVariant = await tx.variant.update({
        where: { sku: item.sku },
        data: {
          stockOnHand: {
            decrement: item.quantity,
          },
        },
      });

      // Check if stock went negative, which means there wasn't enough
      if (updatedVariant.stockOnHand < 0) {
        throw new Error(`Not enough stock for SKU: ${item.sku}`);
      }
    }

    // 2. Create the order and connect the line items
    const newOrder = await tx.order.create({
      data: {
        ...orderData,
        lineItems: {
          create: lineItems.map(item => ({
            quantity: item.quantity,
            actualSalePrice: item.actualSalePrice,
            variant: {
              connect: { sku: item.sku }
            }
          }))
        }
      },
      include: {
        lineItems: true
      }
    });

    return newOrder;
  });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // This transaction handles replenishing stock for cancelled or returned orders.
    // The financial triggers mentioned in the SRS would be added here as well.
    if (status === 'CANCELLED' || status === 'RETURNED') {
        return prisma.$transaction(async (tx) => {
            const orderToUpdate = await tx.order.findUnique({
                where: { id: orderId },
                include: { lineItems: true }
            });

            if (!orderToUpdate) {
                throw new Error('Order not found');
            }

            // Only replenish stock if the order was in a state where stock was committed
            if (orderToUpdate.status === 'NEW' || orderToUpdate.status === 'SHIPPED' || orderToUpdate.status === 'DELIVERED') {
                for (const item of orderToUpdate.lineItems) {
                    await tx.variant.update({
                        where: { sku: item.sku },
                        data: {
                            stockOnHand: {
                                increment: item.quantity
                            }
                        }
                    });
                }
            }

            // Finally, update the order status
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status }
            });

            return updatedOrder;
        });
    }

    // For other status changes (e.g., NEW -> SHIPPED, SHIPPED -> DELIVERED), just update the status.
    // The financial triggers for a DELIVERED order would be handled here.
    return prisma.order.update({
        where: { id: orderId },
        data: { status }
    });
};
