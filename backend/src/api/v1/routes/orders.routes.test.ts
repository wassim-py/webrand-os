import request from 'supertest';
import express from 'express';
import orderRoutes from './orders.routes';
import * as orderService from '../services/order.service';
import { OrderStatus } from '@prisma/client';

// Mock the order service
jest.mock('../services/order.service');
const mockedOrderService = orderService as jest.Mocked<typeof orderService>;

const app = express();
app.use(express.json());
app.use('/orders', orderRoutes);

describe('Order API Routes', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /orders', () => {
    it('should return a list of orders and a 200 status code', async () => {
      const mockOrders = [{ id: '1', customerName: 'Test Customer' }];
      mockedOrderService.getAllOrders.mockResolvedValue(mockOrders as any);

      const response = await request(app).get('/orders');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockOrders);
    });
  });

  describe('POST /orders', () => {
    it('should create a new order and return it with a 201 status code', async () => {
      const newOrderData = {
        orderData: { customerName: 'New Customer' },
        lineItems: [{ sku: 'SKU1', quantity: 1, actualSalePrice: 10 }],
      };
      mockedOrderService.createOrder.mockResolvedValue({ id: '2', ...newOrderData.orderData } as any);

      const response = await request(app)
        .post('/orders')
        .send(newOrderData);

      expect(response.status).toBe(201);
      expect(orderService.createOrder).toHaveBeenCalledWith(newOrderData.orderData, newOrderData.lineItems);
    });

    it('should return 400 if stock is insufficient', async () => {
        const newOrderData = {
            orderData: { customerName: 'New Customer' },
            lineItems: [{ sku: 'SKU-OUTOFSTOCK', quantity: 1, actualSalePrice: 10 }],
        };
        mockedOrderService.createOrder.mockRejectedValue(new Error('Not enough stock for SKU: SKU-OUTOFSTOCK'));

        const response = await request(app)
          .post('/orders')
          .send(newOrderData);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Not enough stock');
      });
  });

  describe('PATCH /orders/:id/status', () => {
    it('should update an order status and return the updated order', async () => {
      const orderId = '1';
      const newStatus: OrderStatus = 'SHIPPED';
      mockedOrderService.updateOrderStatus.mockResolvedValue({ id: orderId, status: newStatus } as any);

      const response = await request(app)
        .patch(`/orders/${orderId}/status`)
        .send({ status: newStatus });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(newStatus);
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith(orderId, newStatus);
    });

    it('should return 400 for an invalid status', async () => {
        const response = await request(app)
          .patch('/orders/1/status')
          .send({ status: 'INVALID_STATUS' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid status provided');
      });
  });

});
