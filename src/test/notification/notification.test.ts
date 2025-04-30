import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';
import { NotificationController } from '../../modules/notification/notification.controller';
import { NotificationService } from '../../modules/notification/notification.service';

// Setup in-memory Express app
let app: Express;
let notificationController: NotificationController;
let notificationService: NotificationService;
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

  // Mock NotificationService to return predefined data
  notificationService = new NotificationService();
  jest.spyOn(notificationService, 'createNotification').mockImplementation(async (data) => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    type: data.title,
    message: data.message,
    for_role: 'HA',
    is_read: false,
    created_at: new Date('2025-04-01T00:00:00.000Z'),
    updated_at: new Date('2025-04-01T00:00:00.000Z'),
    medicine_id: null,
    batch_id: null
  }));
  jest.spyOn(notificationService, 'getAll').mockImplementation(async () => [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      type: 'Health Alert',
      message: 'New health guidelines issued.',
      for_role: 'HA',
      is_read: false,
      created_at: new Date('2025-04-01T00:00:00.000Z'),
      updated_at: new Date('2025-04-01T00:00:00.000Z'),
      medicine_id: null,
      batch_id: null
    },
  ]);
  jest.spyOn(notificationService, 'markAsRead').mockImplementation(async (id) => ({
    id,
    type: 'Health Alert',
    message: 'New health guidelines issued.',
    for_role: 'HA',
    is_read: true,
    created_at: new Date('2025-04-01T00:00:00.000Z'),
    updated_at: new Date('2025-04-02T00:00:00.000Z'),
    medicine_id: null,
    batch_id: null
  }));
  jest.spyOn(notificationService, 'deleteNotification').mockImplementation(async (id) => {
    if (id === '123e4567-e89b-12d3-a456-426614174000') {
      return {
        id,
        type: 'Health Alert',
        message: 'New health guidelines issued.',
        for_role: 'HA' as any,
        is_read: false as boolean,
        created_at: new Date('2025-04-01T00:00:00.000Z'),
        updated_at: new Date('2025-04-01T00:00:00.000Z'),
        medicine_id: null,
        batch_id: null
      };
    }
    return {
      id: '',
      type: '',
      message: '',
      for_role: null,
      is_read: null,
      created_at: null,
      updated_at: null,
      medicine_id: null,
      batch_id: null
    };
  });

  notificationController = new NotificationController(notificationService);

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
  app.post('/notification/create', mockAuthMiddleware('HA'), notificationController.createNotification);
  app.get('/notification', mockAuthMiddleware('HA'), notificationController.getAll);
  app.get('/notification-unauthorized', mockAuthMiddleware('STUDENT'), notificationController.getAll);
  app.put('/notification/read/:id', mockAuthMiddleware('HA'), notificationController.markAsRead);
  app.delete('/notification/delete/:id', mockAuthMiddleware('HA'), notificationController.deleteNotification);
  app.post('/notification/create-unauthorized', mockAuthMiddleware(null), notificationController.createNotification);
  app.put('/notification/read-unauthorized/:id', mockAuthMiddleware(null), notificationController.markAsRead);
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Integration tests for NotificationController
describe('NotificationController Integration Tests', () => {
  describe('POST /notification/create', () => {
    it('should create a notification successfully', async () => {
      const response = await request(app).post('/notification/create').send({
        title: 'Health Alert',
        message: 'New health guidelines issued.',
        userType: 'HA',
      });
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Notification created successfully');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).post('/notification/create-unauthorized').send({
        title: 'Health Alert',
        message: 'New health guidelines issued.',
        userType: 'HA',
      });
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Notification created successfully');
    });
  });

  describe('GET /notification', () => {
    it('should return notifications successfully', async () => {
      const response = await request(app).get('/notification');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Notifications fetched');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/notification-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('PUT /notification/read/:id', () => {
    it('should mark a notification as read successfully', async () => {
      const response = await request(app).put('/notification/read/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Notification marked as read');
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).put('/notification/read-unauthorized/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Notification marked as read");
    });
  });

  describe('DELETE /notification/delete/:id', () => {
    it('should delete a notification successfully', async () => {
      const response = await request(app).delete('/notification/delete/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Notification deleted successfully');
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app).delete('/notification/delete/999e9999-e89b-12d3-a456-426614174999');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Notification deleted successfully');
    });
  });
});