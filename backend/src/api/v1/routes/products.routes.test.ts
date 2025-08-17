import request from 'supertest';
import express from 'express';
import productRoutes from './products.routes';
import * as productService from '../services/product.service';

// Mock the product service to avoid hitting the database
// We are mocking the entire module
jest.mock('../services/product.service');

// Cast the mocked module to the correct type to get type safety
const mockedProductService = productService as jest.Mocked<typeof productService>;

const app = express();
app.use(express.json());
// Mount the routes to be tested
app.use('/', productRoutes);

describe('Product API Routes', () => {

  // Clear all mocks after each test to ensure test isolation
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return a list of variants and a 200 status code', async () => {
      const mockVariants = [
        { sku: 'TS-BLK-S', productName: 'Classic T-Shirt', stockOnHand: 100 },
        { sku: 'TS-BLK-M', productName: 'Classic T-Shirt', stockOnHand: 80 },
      ];
      // Configure the mock to return our mock data when getAllVariants is called
      mockedProductService.getAllVariants.mockResolvedValue(mockVariants as any);

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockVariants);
      expect(productService.getAllVariants).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /', () => {
    it('should create a new product and return it with a 201 status code', async () => {
      const newProductData = {
        productData: { name: 'New Jeans', category: 'Apparel' },
        variantsData: [{ sku: 'JN-NEW-30', size: '30', color: 'black' }],
      };
      const createdProduct = { id: 'some-uuid', ...newProductData.productData, variants: newProductData.variantsData };
      mockedProductService.createProductWithVariants.mockResolvedValue(createdProduct as any);

      const response = await request(app)
        .post('/')
        .send(newProductData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdProduct);
      expect(productService.createProductWithVariants).toHaveBeenCalledWith(
        newProductData.productData,
        newProductData.variantsData
      );
    });

    it('should return 400 if product or variant data is missing', async () => {
        const response = await request(app)
            .post('/')
            .send({ productData: { name: 'Incomplete' } }); // Missing variantsData

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Missing product or variant data');
    });
  });

});
