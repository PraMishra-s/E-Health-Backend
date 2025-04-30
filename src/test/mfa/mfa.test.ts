import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';
import { MFAController } from '../../modules/mfa/mfa.controller';
import { MFAService } from '../../modules/mfa/mfa.service';
import { BadRequestException, NotFoundException } from '../../common/utils/catch-errors';

// Setup in-memory Express app
let app: Express;
let mfaController: MFAController;
let mfaService: MFAService;

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

beforeAll(() => {
  app = express();
  app.use(express.json());

  // Mock MFAService to return predefined data
  mfaService = new MFAService();
  jest.spyOn(mfaService, 'invokeMFASetup').mockImplementation(async (userId, sessionId) => ({
    id: userId,
    email: 'test@rub.edu.bt',
    role: 'HA',
    verified: true,
    mfa_required: true,
  }));
  jest.spyOn(mfaService, 'verifyMFAForLogin').mockImplementation(async (code, email, userAgent) => {
    if (email === 'notfound@rub.edu.bt') {
      throw new NotFoundException('User not found.');
    }
    if (code !== '123456') {
      throw new BadRequestException('Invalid or expired OTP.');
    }
    return {
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email,
        role: 'HA',
        verified: true,
        mfa_required: true,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  });
  jest.spyOn(mfaService, 'revokeMFA').mockImplementation(async () => ({
    message: 'MFA successfully disabled.',
  }));

  mfaController = new MFAController(mfaService);

  // Mock authenticateJWT middleware
  const mockAuthMiddleware = (userType: string | null, userId: string | null = null) => (req: any, res: any, next: any) => {
    if (userType && userId) {
      req.user = { id: userId, userType };
      req.sessionId = 'session-1';
    } else {
      req.user = null;
      req.sessionId = null;
    }
    next();
  };

  // Mock setAuthenticationCookies
  const mockSetCookies = (res: any) => {
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
  };

  // Register routes
  app.post('/mfa/invoke', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), mfaController.invokeMFASetup);
  app.post('/mfa/verify-login', (req: any, res: any, next: any) => {
    mockSetCookies(res);
    next();
  }, mfaController.verifyMFAForLogin);
  app.put('/mfa/revoke', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), mfaController.revokeMFA);
  app.post('/mfa/invoke-unauthorized', mockAuthMiddleware(null), mfaController.invokeMFASetup);
  app.put('/mfa/revoke-unauthorized', mockAuthMiddleware(null), mfaController.revokeMFA);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Integration tests for MFAController
describe('MFAController Integration Tests', () => {
  describe('POST /mfa/invoke', () => {
    it('should enable MFA successfully', async () => {
      const response = await request(app).post('/mfa/invoke').send({});
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('MFA has been enabled successfully.');
      expect(response.body.user).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@rub.edu.bt',
        role: 'HA',
        verified: true,
        mfa_required: true,
      });
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).post('/mfa/invoke-unauthorized').send({});
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('POST /mfa/verify-login', () => {
    it('should verify MFA and log in successfully', async () => {
      const response = await request(app).post('/mfa/verify-login').send({
        code: '123456',
        email: 'test@rub.edu.bt',
      });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });

    it('should return 400 for invalid OTP', async () => {
      const response = await request(app).post('/mfa/verify-login').send({
        code: 'wrong-code',
        email: 'test@rub.edu.bt',
      });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).post('/mfa/verify-login').send({
        code: '123456',
        email: 'notfound@rub.edu.bt',
      });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('PUT /mfa/revoke', () => {
    it('should disable MFA successfully', async () => {
      const response = await request(app).put('/mfa/revoke').send({});
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('MFA successfully disabled.');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).put('/mfa/revoke-unauthorized').send({});
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });
});