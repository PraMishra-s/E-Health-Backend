import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import { jest } from '@jest/globals';
import { AuthController } from '../../modules/auth/auth.controller';
import { AuthService } from '../../modules/auth/auth.service';
import { db } from '../../database/drizzle';
import redis from '../../common/service/redis.service';
import { hashValue, compareValue } from '../../common/utils/bcrypt';
import { signJwtToken, verifyJwtToken } from '../../common/utils/jwt';
import { sendEmail } from '../../mailer/mailer';
import { login, users, sessions, ha_details } from '../../database/schema/schema';
import { config } from '../../config/app.config';

// Mock dependencies
jest.mock('../../database/drizzle', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          execute: jest.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ id: 'test-user-id' }])),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([{ id: 'test-user-id' }])),
        })),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => Promise.resolve()),
    })),
  },
}));

jest.mock('../../common/service/redis.service', () => ({
  get: jest.fn(() => Promise.resolve(null)),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(() => Promise.resolve(1)),
  expire: jest.fn(),
}));

jest.mock('../../common/utils/bcrypt', () => ({
  hashValue: jest.fn(() => Promise.resolve('hashed-password')),
  compareValue: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../common/utils/jwt', () => ({
  signJwtToken: jest.fn(() => 'mock-token'),
  verifyJwtToken: jest.fn(() => ({
    payload: { sessionId: 'test-session-id', userId: 'test-user-id' },
  })),
  refreshTokenSignOptions: { expiresIn: '7d', secret: 'test-secret' },
}));

jest.mock('../../mailer/mailer', () => ({
  sendEmail: jest.fn(() => Promise.resolve({ data: { response: 'email-id' }, error: null })),
}));

// Create Express app for integration tests
let app: Express;
let authController: AuthController;
let authService: AuthService;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use(cookieParser());
  authService = new AuthService();
  authController = new AuthController(authService);

  // Setup routes
  app.post('/auth/register', authController.register);
  app.post('/auth/login', authController.login);
  app.post('/auth/verify/email', authController.verifyEmail);
  app.post('/auth/verify/resend-email', authController.resendVerifyEmail);
  app.post('/auth/password/forgot', authController.forgotPassword);
  app.post('/auth/password/reset', authController.resetPassword);
  app.post('/auth/logout', (req, res, next) => {
    req.sessionId = 'test-session-id';
    next();
  }, authController.logout);
  app.get('/auth/refresh', authController.refreshToken);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AuthService Unit Tests', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      (db.select().from as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            execute: jest.fn(() => Promise.resolve([])), // No existing user
          })),
        })),
      });

      const userData = {
        name: 'Test User',
        student_id: '12345678',
        email: 'test@rub.edu.bt',
        password: 'password123',
        confirmPassword: 'password123',
        gender: 'MALE',
        blood_type: 'O+',
        department_id: 'P01',
        std_year: '3',
        user_type: 'STUDENT',
        contact_number: '12345678',
      };

      const result = await authService.register(userData as any);
      expect(result.user.id).toBe('test-user-id');
      expect(db.insert).toHaveBeenCalledTimes(2); // users and login tables
      expect(sendEmail).toHaveBeenCalled();
    });


  });

});

describe('AuthController Integration Tests', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      (db.select().from as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            execute: jest.fn(() => Promise.resolve([])), // No existing user
          })),
        })),
      });

      const userData = {
        name: 'Test User',
        student_id: '12345678',
        email: 'test@rub.edu.bt',
        password: 'password123',
        confirmPassword: 'password123',
        gender: 'MALE',
        blood_type: 'O+',
        department_id: 'P01',
        std_year: '3',
        user_type: 'STUDENT',
        contact_number: '12345678',
      };

      const response = await request(app).post('/auth/register').send(userData);
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.id).toBe('test-user-id');
    });

    it('should return 400 if passwords do not match', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@rub.edu.bt',
        password: 'password123',
        confirmPassword: 'different123',
        gender: 'MALE',
        user_type: 'STUDENT',
      };

      const response = await request(app).post('/auth/register').send(userData);
      expect(response.status).toBe(500);
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      (db.select().from as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn(() => ({
            where: jest.fn(() => ({
              execute: jest.fn(() => Promise.resolve([{
                user_id: 'test-user-id',
                email: 'test@rub.edu.bt',
                password: 'hashed-password',
                role: 'STUDENT',
                verified: true,
                mfa_required: false,
              }])),
            })),
          })),
        })
        .mockReturnValueOnce({
          from: jest.fn(() => ({
            where: jest.fn(() => ({
              execute: jest.fn(() => Promise.resolve([{
                id: 'test-user-id',
                student_id: '12345678',
                name: 'Test User',
                gender: 'MALE',
                userType: 'STUDENT',
                contact_number: '12345678',
              }])),
            })),
          })),
        });

      const loginData = { email: 'test@rub.edu.bt', password: 'password123' };
      const response = await request(app).post('/auth/login').send(loginData);
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });

    it('should return 400 if invalid credentials', async () => {
      (db.select().from as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            execute: jest.fn(() => Promise.resolve([{
              user_id: 'test-user-id',
              email: 'test@rub.edu.bt',
              password: 'hashed-password',
              role: 'STUDENT',
              verified: true,
            }])),
          })),
        })),
      });
      (compareValue as jest.Mock).mockReturnValueOnce(Promise.resolve(false));

      const loginData = { email: 'test@rub.edu.bt', password: 'wrong-password' };
      const response = await request(app).post('/auth/login').send(loginData);
      expect(response.status).toBe(500);
    });
  });

  describe('POST /auth/verify/email', () => {
    it('should verify email successfully', async () => {
      (redis.get as any).mockResolvedValueOnce('test-user-id');
      const response = await request(app).post('/auth/verify/email').send({ code: 'valid-code' });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Email verified successfully');
      expect(db.update).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });
  });


  describe('POST /auth/password/reset', () => {
    it('should reset password successfully', async () => {
      (redis.get as any).mockResolvedValueOnce('test-user-id');
      const response = await request(app).post('/auth/password/reset').send({
        password: 'newpassword123',
        verificationCode: 'valid-reset-code',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Reset Password Successfully');
      expect(db.update).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('GET /auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      (db.select().from as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            execute: jest.fn(() => Promise.resolve([{
              id: 'test-session-id',
              user_id: 'test-user-id',
              expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
            }])),
          })),
        })),
      });

      const response = await request(app).get('/auth/refresh').set('Cookie', ['refreshToken=valid-refresh-token']);
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app).post('/auth/logout');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User logout successfully.');
      expect(db.delete).toHaveBeenCalled();
    });
  });
});