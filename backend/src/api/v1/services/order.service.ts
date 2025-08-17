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
    for (const item of lineItems) {
      const updatedVariant = await tx.variant.update({
        where: { sku: item.sku },
        data: { stockOnHand: { decrement: item.quantity } },
      });
      if (updatedVariant.stockOnHand < 0) {
        throw new Error(`Not enough stock for SKU: ${item.sku}`);
      }
    }

    const newOrder = await tx.order.create({
      data: {
        ...orderData,
        lineItems: {
          create: lineItems.map(item => ({
            quantity: item.quantity,
            actualSalePrice: item.actualSalePrice,
            variant: { connect: { sku: item.sku } }
          }))
        }
      },
      include: { lineItems: true }
    });
    return newOrder;
  });
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    return prisma.$transaction(async (tx) => {
        const orderToUpdate = await tx.order.findUnique({
            where: { id: orderId },
            include: { lineItems: { include: { variant: true } } }
        });

        if (!orderToUpdate) {
            throw new Error('Order not found');
        }

        // --- Financial & Stock Logic ---

        // 1. Order is DELIVERED: Generate financial transactions
        if (status === 'DELIVERED' && orderToUpdate.status !== 'DELIVERED') {
            const totalRevenue = orderToUpdate.lineItems.reduce((sum, item) => sum + (item.quantity * Number(item.actualSalePrice)), 0);
            const totalCogs = orderToUpdate.lineItems.reduce((sum, item) => sum + (item.quantity * Number(item.variant.costPrice)), 0);

            // Create Collected Revenue entry
            await tx.financesLedger.create({
                data: {
                    transactionName: `Sale: ${orderToUpdate.id}`,
                    type: 'Collected_Revenue',
                    moneyIn: totalRevenue,
                    moneyOut: 0,
                    orderId: orderToUpdate.id,
                }
            });

            // Create COGS entry
            await tx.financesLedger.create({
                data: {
                    transactionName: `COGS: ${orderToUpdate.id}`,
                    type: 'COGS',
                    moneyIn: 0,
                    moneyOut: totalCogs,
                    orderId: orderToUpdate.id,
                }
            });
            // Note: Marketing allocation would be more complex, potentially based on active campaigns.
            // This is a simplified version. A more robust implementation would be needed.
        }

        // 2. Order is RETURNED: Generate return fee and restock items
        if (status === 'RETURNED' && orderToUpdate.status !== 'RETURNED') {
            // Create Return Fee entry (assuming a fixed fee for simplicity)
            const returnFee = 5.00; // This could be a configurable value
            await tx.financesLedger.create({
                data: {
                    transactionName: `Return Fee: ${orderToUpdate.id}`,
                    type: 'Return_Fee',
                    moneyIn: 0,
                    moneyOut: returnFee,
                    orderId: orderToUpdate.id,
                }
            });

            // Restock items
            for (const item of orderToUpdate.lineItems) {
                await tx.variant.update({
                    where: { sku: item.sku },
                    data: { stockOnHand: { increment: item.quantity } }
                });
            }
        }

        // 3. Order is CANCELLED: Just restock items
        if (status === 'CANCELLED' && orderToUpdate.status !== 'CANCELLED') {
             for (const item of orderToUpdate.lineItems) {
                await tx.variant.update({
                    where: { sku: item.sku },
                    data: { stockOnHand: { increment: item.quantity } }
                });
            }
        }

        // --- Update Order Status ---
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: { status }
        });

        return updatedOrder;
    });
};
