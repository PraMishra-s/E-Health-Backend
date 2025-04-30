import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';
import { IllnessController } from '../../modules/illness/illness.controller';
import { IllnessService } from '../../modules/illness/illness.service';
import { NotFoundException } from '../../common/utils/catch-errors';

// Setup in-memory Express app
let app: Express;
let illnessController: IllnessController;
let illnessService: IllnessService;

  // Mock the database module
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

  // Mock IllnessService to return predefined data
  illnessService = new IllnessService();
  jest.spyOn(illnessService, 'createIllness').mockImplementation(async (data) => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: data.name,
    type: data.type,
    description: data.description || null,
    category_id: data.category_id || null,
    created_at: '2025-04-01T00:00:00.000Z',
  }));
  jest.spyOn(illnessService, 'getIllnesses').mockImplementation(async () => [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Diabetes',
      type: 'NON_COMMUNICABLE',
      description: 'Chronic condition affecting blood sugar levels.',
      category_id: '223e4567-e89b-12d3-a456-426614174001',
      created_at: '2025-04-01T00:00:00.000Z',
    },
  ]);
  jest.spyOn(illnessService, 'getIllnessById').mockImplementation(async (id) => {
    if (id === 'non-existent-id') {
      throw new NotFoundException('Illness not found');
    }
    return {
      id,
      name: 'Diabetes',
      type: 'NON_COMMUNICABLE',
      description: 'Chronic condition affecting blood sugar levels.',
      category_id: '223e4567-e89b-12d3-a456-426614174001',
      created_at: '2025-04-01T00:00:00.000Z',
    };
  });
  jest.spyOn(illnessService, 'updateIllness').mockImplementation(async (id, data) => {
    if (id === 'non-existent-id') {
      throw new NotFoundException('Illness not found');
    }
    return {
      id,
      name: data.name || 'Diabetes',
      type: data.type || 'NON_COMMUNICABLE',
      description: data.description || 'Chronic condition affecting blood sugar levels.',
      category_id: data.category_id || '223e4567-e89b-12d3-a456-426614174001',
      created_at: '2025-04-01T00:00:00.000Z',
    };
  });
  jest.spyOn(illnessService, 'deleteIllness').mockImplementation(async (id) => {
    if (id === 'non-existent-id') {
      throw new NotFoundException('Illness not found');
    }
  });

  illnessController = new IllnessController(illnessService);

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
  app.post('/illness/create', mockAuthMiddleware('HA'), illnessController.createIllness);
  app.get('/illness', mockAuthMiddleware('HA'), illnessController.getIllnesses);
  app.get('/illness/:id', mockAuthMiddleware('HA'), illnessController.getIllnessById);
  app.put('/illness/update/:id', mockAuthMiddleware('HA'), illnessController.updateIllness);
  app.delete('/illness/delete/:id', mockAuthMiddleware('HA'), illnessController.deleteIllness);
  app.post('/illness/create-unauthorized', mockAuthMiddleware(null), illnessController.createIllness);
  app.get('/illness-unauthorized', mockAuthMiddleware(null), illnessController.getIllnesses);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Integration tests for IllnessController
describe('IllnessController Integration Tests', () => {
  describe('POST /illness/create', () => {
    it('should create an illness successfully', async () => {
      const response = await request(app).post('/illness/create').send({
        name: 'Diabetes',
        type: 'NON_COMMUNICABLE',
        description: 'Chronic condition affecting blood sugar levels.',
        category_id: '223e4567-e89b-12d3-a456-426614174001',
      });
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Illness added successfully');
      expect(response.body.illness).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Diabetes',
        type: 'NON_COMMUNICABLE',
        description: 'Chronic condition affecting blood sugar levels.',
        category_id: '223e4567-e89b-12d3-a456-426614174001',
        created_at: '2025-04-01T00:00:00.000Z',
      });
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).post('/illness/create-unauthorized').send({
        name: 'Diabetes',
        type: 'NON_COMMUNICABLE',
      });
      expect(response.status).toBe(201);
      expect(response.body.message).toBe("Illness added successfully");
    });
  });

  describe('GET /illness', () => {
    it('should return illnesses successfully', async () => {
      const response = await request(app).get('/illness');
      expect(response.status).toBe(200);
      expect(response.body.illnesses).toEqual([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Diabetes',
          type: 'NON_COMMUNICABLE',
          description: 'Chronic condition affecting blood sugar levels.',
          category_id: '223e4567-e89b-12d3-a456-426614174001',
          created_at: '2025-04-01T00:00:00.000Z',
        },
      ]);
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/illness-unauthorized');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('GET /illness/:id', () => {
    it('should return illness by ID successfully', async () => {
      const response = await request(app).get('/illness/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.illness).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Diabetes',
        type: 'NON_COMMUNICABLE',
        description: 'Chronic condition affecting blood sugar levels.',
        category_id: '223e4567-e89b-12d3-a456-426614174001',
        created_at: '2025-04-01T00:00:00.000Z',
      });
    });

    it('should return 404 for non-existent illness', async () => {
      const response = await request(app).get('/illness/non-existent-id');
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('PUT /illness/update/:id', () => {
    it('should update an illness successfully', async () => {
      const response = await request(app).put('/illness/update/123e4567-e89b-12d3-a456-426614174000').send({
        name: 'Type 2 Diabetes',
        type: 'NON_COMMUNICABLE',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Illness updated successfully');
      expect(response.body.updatedIllness).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Type 2 Diabetes',
        type: 'NON_COMMUNICABLE',
        description: 'Chronic condition affecting blood sugar levels.',
        category_id: '223e4567-e89b-12d3-a456-426614174001',
        created_at: '2025-04-01T00:00:00.000Z',
      });
    });

    it('should return 404 for non-existent illness', async () => {
      const response = await request(app).put('/illness/update/non-existent-id').send({
        name: 'Type 2 Diabetes',
      });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('DELETE /illness/delete/:id', () => {
    it('should delete an illness successfully', async () => {
      const response = await request(app).delete('/illness/delete/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Illness deleted successfully');
    });

    it('should return 404 for non-existent illness', async () => {
      const response = await request(app).delete('/illness/delete/non-existent-id');
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });
  });
});