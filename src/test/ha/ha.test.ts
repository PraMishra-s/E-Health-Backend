import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';
import { HaController } from '../../modules/ha/ha.controller';
import { HaService } from '../../modules/ha/ha.service';

// Mock the Redis module before any imports that use it
jest.mock('@upstash/redis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => {
      return {
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        // Add any other Redis methods you use in your code
      };
    }),
  };
});
  // Mock the database module
  jest.mock('../../database/drizzle', () => ({
    db: {
      query: jest.fn(),
      select: jest.fn(),
      // Add any other database methods that your service uses
    }
  }));

// Setup in-memory Express app
let app: Express;
let haController: HaController;
let haService: HaService;

beforeAll(() => {
  app = express();
  app.use(express.json());

  // Mock HaService methods to return predefined responses
  haService = new HaService();
  jest.spyOn(haService, 'forgotPassword').mockImplementation(async (email: string, secretWord: string) => {
    if (email !== 'test@rub.edu.bt') throw new Error('Invalid email');
    return { emailId: 'email-id', url: 'http://example.com/reset' };
  });
  jest.spyOn(haService, 'toggleAvailability').mockImplementation(async () => false);
  jest.spyOn(haService, 'getHaDetails').mockImplementation(async () => [
    {
      id: 'test-user-id',
      status: 'ACTIVE',
      name: 'Test HA',
      gender: 'MALE',
      contact_number: '12345678',
      email: 'test@rub.edu.bt',
      is_available: true,
      is_onLeave: false,
    },
  ]);

  haController = new HaController(haService);

  // Mock authenticateJWT middleware
  const mockAuthMiddleware = (userType: string) => (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', userType };
    next();
  };

  // Register routes
  app.post('/ha/forgot-password', haController.forgotPassword);
  app.put('/ha/toggle-availability', mockAuthMiddleware('HA'), haController.toggleAvailability);
  app.get('/ha/get-ha-details', mockAuthMiddleware('HA'), haController.getHaDetails);
  app.get('/ha/get-ha-details-unauthorized', mockAuthMiddleware('STUDENT'), haController.getHaDetails);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Integration tests for HaController
describe('HaController Integration Tests', () => {
  describe('POST /ha/forgot-password', () => {
    it('should send password reset email successfully', async () => {
      const response = await request(app).post('/ha/forgot-password').send({
        email: 'test@rub.edu.bt',
        secret_word: 'secret123',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset Email send');
    });
  });

  describe('PUT /ha/toggle-availability', () => {
    it('should toggle availability successfully', async () => {
      const response = await request(app).put('/ha/toggle-availability');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Availability updated successfully.');
      expect(response.body.is_available).toBe(false);
    });

    it('should return 401 for non-HA user', async () => {
      app.put('/ha/toggle-availability-unauthorized', (req: any, res: any, next: any) => {
        req.user = { id: 'test-user-id', userType: 'STUDENT' };
        next();
      }, haController.toggleAvailability);

      const response = await request(app).put('/ha/toggle-availability-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('GET /ha/get-ha-details', () => {
    it('should retrieve HA details successfully', async () => {
      const response = await request(app).get('/ha/get-ha-details');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('HA details fetched successfully.');
      expect(response.body.haDetails).toEqual([
        {
          id: 'test-user-id',
          status: 'ACTIVE',
          name: 'Test HA',
          gender: 'MALE',
          contact_number: '12345678',
          email: 'test@rub.edu.bt',
          is_available: true,
          is_onLeave: false,
        },
      ]);
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/ha/get-ha-details-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });
});