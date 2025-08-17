import { Request, Response } from 'express';
import * as orderService from '../services/order.service';
import { OrderStatus } from '@prisma/client';

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getAllOrders();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { orderData, lineItems } = req.body;
    if (!orderData || !lineItems || !lineItems.length) {
      return res.status(400).json({ message: 'Missing order data or line items' });
    }
    const newOrder = await orderService.createOrder(orderData, lineItems);
    res.status(201).json(newOrder);
  } catch (error) {
    // Check for specific error messages from the service
    if (error instanceof Error && error.message.includes('Not enough stock')) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating order', error });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Basic validation for status
        if (!status || !Object.values(OrderStatus).includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        const updatedOrder = await orderService.updateOrderStatus(id, status);
        res.status(200).json(updatedOrder);
    } catch (error) {
        if (error instanceof Error) {
            return res.status(500).json({ message: 'Error updating order status', error: error.message });
        }
        res.status(500).json({ message: 'An unknown error occurred' });
    }
};
