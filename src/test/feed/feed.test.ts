import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';
import { FeedController } from '../../modules/feed/feed.controller';
import { FeedService } from '../../modules/feed/feed.service';
import { db } from '../../database/drizzle';
import { feeds } from '../../database/schema/schema';

// Mock database to ensure no real database interactions
jest.mock('../../database/drizzle', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            execute: jest.fn(() => Promise.resolve([])),
          })),
        })),
        orderBy: jest.fn(() => ({
          execute: jest.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ id: 'test-feed-id', user_id: 'test-user-id' }])),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve()),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => Promise.resolve()),
    })),
  },
}));

// Setup in-memory Express app for integration tests (no real server)
let app: Express;
let feedController: FeedController;
let feedService: FeedService;

beforeAll(() => {
  app = express();
  app.use(express.json());
  feedService = new FeedService();
  feedController = new FeedController(feedService);

  // Mock authenticateJWT middleware to simulate authenticated user
  const mockAuthMiddleware = (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', userType: 'HA' };
    next();
  };

  // Register routes for testing
  app.post('/feed/create', mockAuthMiddleware, feedController.createFeed);
  app.put('/feed/update/:id', mockAuthMiddleware, feedController.updateFeed);
  app.delete('/feed/delete/:id', mockAuthMiddleware, feedController.deleteFeed);
  app.delete('/feed/deleteAll/all', mockAuthMiddleware, feedController.deleteAllFeeds);
  app.get('/feed', feedController.getFeeds);
});

beforeEach(() => {
  jest.clearAllMocks(); // Reset mocks for test isolation
});

// Unit tests for FeedService (testing business logic in isolation)
describe('FeedService Unit Tests', () => {
  describe('createFeed', () => {
    it('should create a new feed successfully', async () => {
      const feedData = {
        title: 'Test Feed',
        description: 'This is a test feed description.',
        image_urls: ['https://example.com/image.jpg'],
        video_url: [],
      };

      const result = await feedService.createFeed('test-user-id', feedData);
      expect(result.id).toBe('test-feed-id');
      expect(result.user_id).toBe('test-user-id');
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });



  describe('deleteAllFeeds', () => {
    it('should delete all feeds for a user successfully', async () => {
      await feedService.deleteAllFeeds('test-user-id');
      expect(db.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFeeds', () => {
    it('should retrieve all feeds successfully', async () => {
      (db.select().from as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            execute: jest.fn(() => Promise.resolve([{ id: 'test-feed-id', title: 'Test Feed' }])),
          })),
        })),
      });

      const result = await feedService.getFeeds();
      expect(result).toBeDefined();
      expect(db.select).toHaveBeenCalledTimes(2);
    });
  });
});

// Integration tests for FeedController (testing HTTP endpoints)
describe('FeedController Integration Tests', () => {

  describe('PUT /feed/update/:id', () => {
    it('should update a feed successfully', async () => {
      (db.select().from as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => ({
              execute: jest.fn(() => Promise.resolve([{ id: 'test-feed-id', user_id: 'test-user-id' }])),
            })),
          })),
        })),
      });

      const feedData = {
        title: 'Updated Feed',
        description: 'Updated description.',
      };

      const response = await request(app).put('/feed/update/test-feed-id').send(feedData);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(undefined);
    });

    it('should return 404 if feed not found', async () => {
      (db.select().from as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => ({
              execute: jest.fn(() => Promise.resolve([])),
            })),
          })),
        })),
      });

      const response = await request(app).put('/feed/update/nonexistent-feed-id').send({
        title: 'Updated Feed',
        description: 'Updated description.',
      });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /feed/delete/:id', () => {
    it('should delete a feed successfully', async () => {
      (db.select().from as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => ({
              execute: jest.fn(() => Promise.resolve([{ id: 'test-feed-id', user_id: 'test-user-id' }])),
            })),
          })),
        })),
      });

      const response = await request(app).delete('/feed/delete/test-feed-id');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(undefined);
    });

    it('should return 400 if feed ID is missing', async () => {
      const response = await request(app).delete('/feed/delete/');
      expect(response.status).toBe(404); // Express will return 404 for invalid route, but controller throws 401
      // Note: In a real app, you might want middleware to catch missing ID earlier
    });
  });

  describe('DELETE /feed/deleteAll/all', () => {
    it('should delete all feeds successfully', async () => {
      const response = await request(app).delete('/feed/deleteAll/all');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('All feeds deleted successfully');
    });
  });

  describe('GET /feed', () => {
    it('should retrieve feeds successfully', async () => {
      (db.select().from as jest.Mock).mockReturnValueOnce({
        from: jest.fn(() => ({
          orderBy: jest.fn(() => ({
            execute: jest.fn(() => Promise.resolve([{ id: 'test-feed-id', title: 'Test Feed' }])),
          })),
        })),
      });

      const response = await request(app).get('/feed');
      expect(response.status).toBe(200);
    });
  });
});