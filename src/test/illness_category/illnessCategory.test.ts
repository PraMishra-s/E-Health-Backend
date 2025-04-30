import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';
import { IllnessCategoryController } from '../../modules/illness_category/illnessCategory.controller';
import { IllnessCategoryService } from '../../modules/illness_category/illnessCategory.service';

// Setup in-memory Express app
let app: Express;
let illnessCategoryController: IllnessCategoryController;
let illnessCategoryService: IllnessCategoryService;

jest.mock('../../database/drizzle', () => ({
    db: {
      query: jest.fn(),
      select: jest.fn(),
      // Add any other database methods that your service uses
    }
  }));

beforeAll(() => {
  app = express();
  app.use(express.json());

  // Mock IllnessCategoryService to return predefined data
  illnessCategoryService = new IllnessCategoryService();
  jest.spyOn(illnessCategoryService, 'createCategory').mockImplementation(async (data) => {
    if (data.name === 'Viral') {
      throw new Error('Category with this name already exists');
    }
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: data.name,
      created_at: '2025-04-01T00:00:00.000Z',
    };
  });
  jest.spyOn(illnessCategoryService, 'getAllCategories').mockImplementation(async () => [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Bacterial',
      created_at: '2025-04-01T00:00:00.000Z',
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Chronic',
      created_at: '2025-04-02T00:00:00.000Z',
    },
  ]);
  jest.spyOn(illnessCategoryService, 'updateCategory').mockImplementation(async (id, data) => ({
    id,
    name: data.name || 'Bacterial',
    created_at: '2025-04-01T00:00:00.000Z',
  }));
  jest.spyOn(illnessCategoryService, 'deleteCategory').mockImplementation(async () => {});

  illnessCategoryController = new IllnessCategoryController(illnessCategoryService);

  // Mock authenticateJWT middleware
  const mockAuthMiddleware = (userType: string | null) => (req: any, res: any, next: any) => {
    if (userType) {
      req.user = { id: 'test-user-id', userType };
    } else {
      req.user = null; // Simulate unauthenticated user
    }
    next();
  };

  // Register routes
  app.post('/illness_category/create', mockAuthMiddleware('HA'), illnessCategoryController.createCategory);
  app.get('/illness_category', mockAuthMiddleware('HA'), illnessCategoryController.getAllCategories);
  app.put('/illness_category/update/:id', mockAuthMiddleware('HA'), illnessCategoryController.updateCategory);
  app.delete('/illness_category/delete/:id', mockAuthMiddleware('HA'), illnessCategoryController.deleteCategory);
  app.post('/illness_category/create-unauthorized', mockAuthMiddleware(null), illnessCategoryController.createCategory);
  app.get('/illness_category-unauthorized', mockAuthMiddleware(null), illnessCategoryController.getAllCategories);
  app.put('/illness_category/update-unauthorized/:id', mockAuthMiddleware(null), illnessCategoryController.updateCategory);
  app.delete('/illness_category/delete-unauthorized/:id', mockAuthMiddleware(null), illnessCategoryController.deleteCategory);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Integration tests for IllnessCategoryController
describe('IllnessCategoryController Integration Tests', () => {
  describe('POST /illness_category/create', () => {
    it('should create a category successfully', async () => {
      const response = await request(app).post('/illness_category/create').send({
        name: 'Bacterial',
      });
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Category created successfully');
      expect(response.body.category).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Bacterial',
        created_at: '2025-04-01T00:00:00.000Z',
      });
    });

    it('should return 400 for duplicate category name', async () => {
      const response = await request(app).post('/illness_category/create').send({
        name: 'Viral',
      });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).post('/illness_category/create-unauthorized').send({
        name: 'Bacterial',
      });
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Category created successfully');
    });
  });

  describe('GET /illness_category', () => {
    it('should return categories successfully', async () => {
      const response = await request(app).get('/illness_category');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Categories retrieved successfully');
      expect(response.body.categories).toEqual([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Bacterial',
          created_at: '2025-04-01T00:00:00.000Z',
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          name: 'Chronic',
          created_at: '2025-04-02T00:00:00.000Z',
        },
      ]);
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/illness_category-unauthorized');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Categories retrieved successfully');
    });
  });

  describe('PUT /illness_category/update/:id', () => {
    it('should update a category successfully', async () => {
      const response = await request(app).put('/illness_category/update/123e4567-e89b-12d3-a456-426614174000').send({
        name: 'Fungal',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category updated successfully');
      expect(response.body.updatedCategory).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Fungal',
        created_at: '2025-04-01T00:00:00.000Z',
      });
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).put('/illness_category/update-unauthorized/123e4567-e89b-12d3-a456-426614174000').send({
        name: 'Fungal',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Category updated successfully");
    });
  });

  describe('DELETE /illness_category/delete/:id', () => {
    it('should delete a category successfully', async () => {
      const response = await request(app).delete('/illness_category/delete/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).delete('/illness_category/delete-unauthorized/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Category deleted successfully');
    });
  });
});