import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';

import { BadRequestException } from '../../common/utils/catch-errors';
import { UserController } from '../../modules/user/user.controller';
import { UserService } from '../../modules/user/user.service';

// Setup in-memory Express app
let app: Express;
let userController: UserController;
let userService: UserService;

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

  // Mock UserService to return predefined data
  userService = new UserService();
  jest.spyOn(userService, 'updateUser').mockImplementation(async (userId, data) => ({
    id: userId,
    name: data.name || 'John Doe',
    gender: data.gender || 'MALE',
    contact_number: data.contact_number || '12345678',
    blood_type: data.blood_type || 'O+',
    department_id: data.department_id || 'dept-1',
    student_id: '12345',
    userType: 'STUDENT',
    std_year: '2',
    profile_url: null,
    date_of_birth: new Date('2000-01-01'),
  }));
  jest.spyOn(userService, 'getEmail').mockImplementation(async (email) => {
    if (email === 'notfound@rub.edu.bt') return 'NOT_FOUND';
    if (email === 'ha@rub.edu.bt') return 'HA';
    return 'USER';
  });
  jest.spyOn(userService, 'updateProfilePic').mockImplementation(async (userId, data) => ({
    id: userId,
    name: 'John Doe',
    gender: 'MALE',
    contact_number: '12345678',
    blood_type: 'O+',
    department_id: 'dept-1',
    student_id: '12345',
    userType: 'STUDENT',
    std_year: '2',
    profile_url: data.profile_url || null,
    date_of_birth: new Date('2000-01-01'),
  }));
  jest.spyOn(userService, 'changePassword').mockImplementation(async (userId, currentPassword) => {
    if (currentPassword !== 'correctPassword') {
      throw new BadRequestException('Current password is incorrect.');
    }
  });
  jest.spyOn(userService, 'getUsers').mockImplementation(async () => [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      student_id: '12345',
      name: 'John Doe',
      gender: 'MALE',
      department_id: 'dept-1',
      std_year: '2',
      userType: 'STUDENT',
      blood_type: 'O+',
      contact_number: '12345678',
      profile_url: null,
      family_members: [],
    },
  ]);
  jest.spyOn(userService, 'getProgrammes').mockImplementation(async () => [
    {
      programme_id: 'prog-1',
      programme_name: 'Computer Science',
    },
  ]);
  jest.spyOn(userService, 'changeUserType').mockImplementation(async (userId, type) => ({
    id: userId,
    name: 'John Doe',
    gender: 'MALE',
    contact_number: '12345678',
    blood_type: 'O+',
    department_id: 'dept-1',
    student_id: '12345',
    userType: type,
    std_year: '2',
    profile_url: null,
    date_of_birth: new Date('2000-01-01'),
  }));
  jest.spyOn(userService, 'getStaff').mockImplementation(async () => [
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Jane Smith',
      gender: 'FEMALE',
      department_id: 'dept-2',
      userType: 'STAFF',
      contact_number: '87654321',
    },
  ]);

  userController = new UserController(userService);

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

  // Mock rateLimiter middleware (pass-through for tests)
  const mockRateLimiter = (req: any, res: any, next: any) => next();

  // Register routes
  app.put('/users/update', mockAuthMiddleware('STUDENT', '123e4567-e89b-12d3-a456-426614174000'), userController.updateUserProfile);
  app.post('/users/email', mockRateLimiter, userController.getEmail);
  app.put('/users/update-profile', mockAuthMiddleware('STUDENT', '123e4567-e89b-12d3-a456-426614174000'), userController.updatePofilePic);
  app.put('/users/change-password', mockAuthMiddleware('STUDENT', '123e4567-e89b-12d3-a456-426614174000'), mockRateLimiter, userController.changePassword);
  app.get('/users/users', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), userController.getUsers);
  app.get('/users/programmes', mockAuthMiddleware('STUDENT', '123e4567-e89b-12d3-a456-426614174000'), userController.getProgrammes);
  app.put('/users/change-userType/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), userController.changeUserType);
  app.get('/users/getStaff', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), userController.getStaff);
  app.put('/users/update-unauthorized', mockAuthMiddleware(null), userController.updateUserProfile);
  app.put('/users/update-profile-unauthorized', mockAuthMiddleware(null), userController.updatePofilePic);
  app.put('/users/change-password-unauthorized', mockAuthMiddleware(null), userController.changePassword);
  app.get('/users/users-unauthorized', mockAuthMiddleware('STUDENT', '123e4567-e89b-12d3-a456-426614174000'), userController.getUsers);
  app.get('/users/programmes-unauthorized', mockAuthMiddleware(null), userController.getProgrammes);
  app.put('/users/change-userType-unauthorized/:id', mockAuthMiddleware('STUDENT', '123e4567-e89b-12d3-a456-426614174000'), userController.changeUserType);
  app.get('/users/getStaff-unauthorized', mockAuthMiddleware('STUDENT', '123e4567-e89b-12d3-a456-426614174000'), userController.getStaff);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Integration tests for UserController
describe('UserController Integration Tests', () => {
  describe('PUT /users/update', () => {
    it('should update user profile successfully', async () => {
      const response = await request(app).put('/users/update').send({
        name: 'Jane Doe',
        gender: 'FEMALE',
        contact_number: '87654321',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User profile updated successfully');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).put('/users/update-unauthorized').send({
        name: 'Jane Doe',
      });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('POST /users/email', () => {
    it('should return user type successfully', async () => {
      const response = await request(app).post('/users/email').send({
        email: 'ha@rub.edu.bt',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User type retrieved successfully');
      expect(response.body.userType).toBe('HA');
    });

    it('should return NOT_FOUND for non-existent email', async () => {
      const response = await request(app).post('/users/email').send({
        email: 'notfound@rub.edu.bt',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User type retrieved successfully');
      expect(response.body.userType).toBe('NOT_FOUND');
    });
  });

  describe('PUT /users/update-profile', () => {
    it('should update profile picture successfully', async () => {
      const response = await request(app).put('/users/update-profile').send({
        profile_url: 'https://example.com/profile.jpg',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User profile picture updated successfully');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).put('/users/update-profile-unauthorized').send({
        profile_url: 'https://example.com/profile.jpg',
      });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('PUT /users/change-password', () => {
    it('should change password successfully', async () => {
      const response = await request(app).put('/users/change-password').send({
        currentPassword: 'correctPassword',
        newPassword: 'newPassword123',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password changed successfully.');
    });

    it('should return 400 for incorrect current password', async () => {
      const response = await request(app).put('/users/change-password').send({
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('GET /users/users', () => {
    it('should return users successfully', async () => {
      const response = await request(app).get('/users/users');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Users Retrieved Succesfully');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/users/users-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('GET /users/programmes', () => {
    it('should return programmes successfully', async () => {
      const response = await request(app).get('/users/programmes');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Programmes Retrieved Succesfully');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/users/programmes-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('PUT /users/change-userType/:id', () => {
    it('should change user type successfully', async () => {
      const response = await request(app).put('/users/change-userType/123e4567-e89b-12d3-a456-426614174000').send({
        type: 'STAFF',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User Type Changed Succesfully');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).put('/users/change-userType-unauthorized/123e4567-e89b-12d3-a456-426614174000').send({
        type: 'STAFF',
      });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });

  describe('GET /users/getStaff', () => {
    it('should return staff successfully', async () => {
      const response = await request(app).get('/users/getStaff');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Staff Retrieved Succesfully');
      expect(response.body.staff).toEqual([
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          name: 'Jane Smith',
          gender: 'FEMALE',
          department_id: 'dept-2',
          userType: 'STAFF',
          contact_number: '87654321',
        },
      ]);
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/users/getStaff-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Unauthorized');
    });
  });
});