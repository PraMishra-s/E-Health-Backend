import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';
import { SessionController } from '../../modules/session/session.controller';
import { SessionService } from '../../modules/session/session.service';
import { NotFoundException, UnauthorizedException } from '../../common/utils/catch-errors';

// Setup in-memory Express app
let app: Express;
let sessionController: SessionController;
let sessionService: SessionService;

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

  // Mock SessionService to return predefined data
  sessionService = new SessionService();
  jest.spyOn(sessionService, 'getAllSessionsBySessionId').mockImplementation(async (userId, sessionId) => [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: userId,
      user_agent: 'Mozilla/5.0',
      created_at: new Date('2025-04-01T00:00:00.000Z'),
      expired_at: new Date('2025-04-08T00:00:00.000Z'),
      isCurrent: true,
    },
  ]);
  jest.spyOn(sessionService, 'getSessionById').mockImplementation(async (sessionId) => {
    if (sessionId === 'non-existent-id') {
      throw new NotFoundException('Session not found.');
    }
    return {
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '223e4567-e89b-12d3-a456-426614174001',
        userAgent: 'Mozilla/5.0',
        createdAt: '2025-04-01T00:00:00.000Z',
        expiredAt: '2025-04-08T00:00:00.000Z',
        email: 'test@rub.edu.bt',
        student_id: '12345',
        name: 'John Doe',
        gender: 'MALE',
        department_id: 'dept-1',
        std_year: 2,
        userType: 'STUDENT',
        blood_type: 'O+',
        contact_number: '12345678',
        profile_url: null,
        mfa_required: false,
        is_available: true,
        isOnLeave: false,
      },
    };
  });
  jest.spyOn(sessionService, 'deleteSession').mockImplementation(async (sessionId, userId) => {
    if (sessionId === 'non-existent-id') {
      throw new NotFoundException('Session not found or unauthorized to delete.');
    }
  });
  jest.spyOn(sessionService, 'deleteAllSessions').mockImplementation(async (userId) => ({
    message: 'All sessions removed successfully',
  }));

  sessionController = new SessionController(sessionService);

  // Mock authentication middleware
  const mockAuthMiddleware = (userType: string | null, userId: string | null = null, sessionId: string | null = null) => (
    req: any,
    res: any,
    next: any
  ) => {
    if (userType && userId) {
      req.user = { id: userId, userType };
      req.sessionId = sessionId || '123e4567-e89b-12d3-a456-426614174000';
    } else {
      req.user = null;
      req.sessionId = null;
    }
    next();
  };

  // Mock clearAuthenticationCookies
  const mockClearCookies = (res: any) => {
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  };

  // Register routes
  app.get('/session/all', mockAuthMiddleware('STUDENT', '223e4567-e89b-12d3-a456-426614174001'), sessionController.getAllSession);
  app.get('/session', mockAuthMiddleware('STUDENT', '223e4567-e89b-12d3-a456-426614174001'), sessionController.getSession);
  app.delete(
    '/session/:id',
    mockAuthMiddleware('STUDENT', '223e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174000'),
    (req: any, res: any, next: any) => {
      if (req.params.id === '123e4567-e89b-12d3-a456-426614174000') {
        mockClearCookies(res);
      }
      next();
    },
    sessionController.deleteSession
  );
  app.delete(
    '/session/delete/all',
    mockAuthMiddleware('STUDENT', '223e4567-e89b-12d3-a456-426614174001'),
    (req: any, res: any, next: any) => {
      mockClearCookies(res);
      next();
    },
    sessionController.deleteAllSessions
  );
  app.get('/session/all-unauthorized', mockAuthMiddleware(null, null, null), sessionController.getAllSession);
  app.get('/session-unauthorized', mockAuthMiddleware(null, null, null), sessionController.getSession);
  app.delete(
    '/session/non-existent-id',
    mockAuthMiddleware('STUDENT', '223e4567-e89b-12d3-a456-426614174001'),
    sessionController.deleteSession
  );
  app.delete('/session/delete/all-unauthorized', mockAuthMiddleware(null, null, null), sessionController.deleteAllSessions);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Integration tests for SessionController
describe('SessionController Integration Tests', () => {
  describe('GET /session/all', () => {
    it('should retrieve all sessions successfully', async () => {
      const response = await request(app).get('/session/all');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Retrieved all sessions successfully');
      expect(response.body.sessions).toEqual([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: '223e4567-e89b-12d3-a456-426614174001',
          user_agent: 'Mozilla/5.0',
          created_at: '2025-04-01T00:00:00.000Z',
          expired_at: '2025-04-08T00:00:00.000Z',
          isCurrent: true,
        },
      ]);
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/session/all-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('GET /session', () => {
    it('should retrieve current session successfully', async () => {
      const response = await request(app).get('/session');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session retrieved Successfully');
      expect(response.body.user).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        userId: '223e4567-e89b-12d3-a456-426614174001',
        userAgent: 'Mozilla/5.0',
        createdAt: '2025-04-01T00:00:00.000Z',
        expiredAt: '2025-04-08T00:00:00.000Z',
        email: 'test@rub.edu.bt',
        student_id: '12345',
        name: 'John Doe',
        gender: 'MALE',
        department_id: 'dept-1',
        std_year: 2,
        userType: 'STUDENT',
        blood_type: 'O+',
        contact_number: '12345678',
        profile_url: null,
        mfa_required: false,
        is_available: true,
        isOnLeave: false,
      });
    });

    it('should return 404 for missing session ID', async () => {
      const response = await request(app).get('/session-unauthorized');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('DELETE /session/:id', () => {
    it('should delete session successfully and clear cookies for current session', async () => {
      const response = await request(app).delete('/session/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Session removed successfully and User logout.');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app).delete('/session/non-existent-id');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('DELETE /session/delete/all', () => {
    it('should delete all sessions successfully and clear cookies', async () => {
      const response = await request(app).delete('/session/delete/all');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('All Session removed successfully and user logged out.');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).delete('/session/delete/all-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });
});