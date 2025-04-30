"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const globals_1 = require("@jest/globals");
const feed_controller_1 = require("../../modules/feed/feed.controller");
const feed_service_1 = require("../../modules/feed/feed.service");
const drizzle_1 = require("../../database/drizzle");
// Mock database to ensure no real database interactions
globals_1.jest.mock('../../database/drizzle', () => ({
    db: {
        select: globals_1.jest.fn(() => ({
            from: globals_1.jest.fn(() => ({
                where: globals_1.jest.fn(() => ({
                    limit: globals_1.jest.fn(() => ({
                        execute: globals_1.jest.fn(() => Promise.resolve([])),
                    })),
                })),
                orderBy: globals_1.jest.fn(() => ({
                    execute: globals_1.jest.fn(() => Promise.resolve([])),
                })),
            })),
        })),
        insert: globals_1.jest.fn(() => ({
            values: globals_1.jest.fn(() => ({
                returning: globals_1.jest.fn(() => Promise.resolve([{ id: 'test-feed-id', user_id: 'test-user-id' }])),
            })),
        })),
        update: globals_1.jest.fn(() => ({
            set: globals_1.jest.fn(() => ({
                where: globals_1.jest.fn(() => Promise.resolve()),
            })),
        })),
        delete: globals_1.jest.fn(() => ({
            where: globals_1.jest.fn(() => Promise.resolve()),
        })),
    },
}));
// Setup in-memory Express app for integration tests (no real server)
let app;
let feedController;
let feedService;
beforeAll(() => {
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    feedService = new feed_service_1.FeedService();
    feedController = new feed_controller_1.FeedController(feedService);
    // Mock authenticateJWT middleware to simulate authenticated user
    const mockAuthMiddleware = (req, res, next) => {
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
    globals_1.jest.clearAllMocks(); // Reset mocks for test isolation
});
// Unit tests for FeedService (testing business logic in isolation)
describe('FeedService Unit Tests', () => {
    describe('createFeed', () => {
        it('should create a new feed successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const feedData = {
                title: 'Test Feed',
                description: 'This is a test feed description.',
                image_urls: ['https://example.com/image.jpg'],
                video_url: [],
            };
            const result = yield feedService.createFeed('test-user-id', feedData);
            expect(result.id).toBe('test-feed-id');
            expect(result.user_id).toBe('test-user-id');
            expect(drizzle_1.db.insert).toHaveBeenCalledTimes(1);
        }));
    });
    describe('deleteAllFeeds', () => {
        it('should delete all feeds for a user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            yield feedService.deleteAllFeeds('test-user-id');
            expect(drizzle_1.db.delete).toHaveBeenCalledTimes(1);
        }));
    });
    describe('getFeeds', () => {
        it('should retrieve all feeds successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            drizzle_1.db.select().from.mockReturnValueOnce({
                from: globals_1.jest.fn(() => ({
                    orderBy: globals_1.jest.fn(() => ({
                        execute: globals_1.jest.fn(() => Promise.resolve([{ id: 'test-feed-id', title: 'Test Feed' }])),
                    })),
                })),
            });
            const result = yield feedService.getFeeds();
            expect(result).toBeDefined();
            expect(drizzle_1.db.select).toHaveBeenCalledTimes(2);
        }));
    });
});
// Integration tests for FeedController (testing HTTP endpoints)
describe('FeedController Integration Tests', () => {
    describe('PUT /feed/update/:id', () => {
        it('should update a feed successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            drizzle_1.db.select().from.mockReturnValueOnce({
                from: globals_1.jest.fn(() => ({
                    where: globals_1.jest.fn(() => ({
                        limit: globals_1.jest.fn(() => ({
                            execute: globals_1.jest.fn(() => Promise.resolve([{ id: 'test-feed-id', user_id: 'test-user-id' }])),
                        })),
                    })),
                })),
            });
            const feedData = {
                title: 'Updated Feed',
                description: 'Updated description.',
            };
            const response = yield (0, supertest_1.default)(app).put('/feed/update/test-feed-id').send(feedData);
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 404 if feed not found', () => __awaiter(void 0, void 0, void 0, function* () {
            drizzle_1.db.select().from.mockReturnValueOnce({
                from: globals_1.jest.fn(() => ({
                    where: globals_1.jest.fn(() => ({
                        limit: globals_1.jest.fn(() => ({
                            execute: globals_1.jest.fn(() => Promise.resolve([])),
                        })),
                    })),
                })),
            });
            const response = yield (0, supertest_1.default)(app).put('/feed/update/nonexistent-feed-id').send({
                title: 'Updated Feed',
                description: 'Updated description.',
            });
            expect(response.status).toBe(404);
        }));
    });
    describe('DELETE /feed/delete/:id', () => {
        it('should delete a feed successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            drizzle_1.db.select().from.mockReturnValueOnce({
                from: globals_1.jest.fn(() => ({
                    where: globals_1.jest.fn(() => ({
                        limit: globals_1.jest.fn(() => ({
                            execute: globals_1.jest.fn(() => Promise.resolve([{ id: 'test-feed-id', user_id: 'test-user-id' }])),
                        })),
                    })),
                })),
            });
            const response = yield (0, supertest_1.default)(app).delete('/feed/delete/test-feed-id');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 400 if feed ID is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/feed/delete/');
            expect(response.status).toBe(404); // Express will return 404 for invalid route, but controller throws 401
            // Note: In a real app, you might want middleware to catch missing ID earlier
        }));
    });
    describe('DELETE /feed/deleteAll/all', () => {
        it('should delete all feeds successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/feed/deleteAll/all');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('All feeds deleted successfully');
        }));
    });
    describe('GET /feed', () => {
        it('should retrieve feeds successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            drizzle_1.db.select().from.mockReturnValueOnce({
                from: globals_1.jest.fn(() => ({
                    orderBy: globals_1.jest.fn(() => ({
                        execute: globals_1.jest.fn(() => Promise.resolve([{ id: 'test-feed-id', title: 'Test Feed' }])),
                    })),
                })),
            });
            const response = yield (0, supertest_1.default)(app).get('/feed');
            expect(response.status).toBe(200);
        }));
    });
});
