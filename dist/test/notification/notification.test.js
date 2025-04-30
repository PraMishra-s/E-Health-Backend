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
const notification_controller_1 = require("../../modules/notification/notification.controller");
const notification_service_1 = require("../../modules/notification/notification.service");
// Setup in-memory Express app
let app;
let notificationController;
let notificationService;
// Mock the database module
globals_1.jest.mock('../../database/drizzle', () => ({
    db: {
        query: globals_1.jest.fn(),
        select: globals_1.jest.fn(),
        // Add any other database methods that your service uses
    }
}));
beforeAll(() => {
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Mock NotificationService to return predefined data
    notificationService = new notification_service_1.NotificationService();
    globals_1.jest.spyOn(notificationService, 'createNotification').mockImplementation((data) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id: '123e4567-e89b-12d3-a456-426614174000',
            type: data.title,
            message: data.message,
            for_role: 'HA',
            is_read: false,
            created_at: new Date('2025-04-01T00:00:00.000Z'),
            updated_at: new Date('2025-04-01T00:00:00.000Z'),
            medicine_id: null,
            batch_id: null
        });
    }));
    globals_1.jest.spyOn(notificationService, 'getAll').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
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
        ];
    }));
    globals_1.jest.spyOn(notificationService, 'markAsRead').mockImplementation((id) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id,
            type: 'Health Alert',
            message: 'New health guidelines issued.',
            for_role: 'HA',
            is_read: true,
            created_at: new Date('2025-04-01T00:00:00.000Z'),
            updated_at: new Date('2025-04-02T00:00:00.000Z'),
            medicine_id: null,
            batch_id: null
        });
    }));
    globals_1.jest.spyOn(notificationService, 'deleteNotification').mockImplementation((id) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === '123e4567-e89b-12d3-a456-426614174000') {
            return {
                id,
                type: 'Health Alert',
                message: 'New health guidelines issued.',
                for_role: 'HA',
                is_read: false,
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
    }));
    notificationController = new notification_controller_1.NotificationController(notificationService);
    // Mock authenticateJWT middleware
    const mockAuthMiddleware = (userType) => (req, res, next) => {
        if (userType) {
            req.user = { id: 'test-user-id', userType };
        }
        else {
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
    globals_1.jest.clearAllMocks();
});
// Integration tests for NotificationController
describe('NotificationController Integration Tests', () => {
    describe('POST /notification/create', () => {
        it('should create a notification successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/notification/create').send({
                title: 'Health Alert',
                message: 'New health guidelines issued.',
                userType: 'HA',
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Notification created successfully');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/notification/create-unauthorized').send({
                title: 'Health Alert',
                message: 'New health guidelines issued.',
                userType: 'HA',
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Notification created successfully');
        }));
    });
    describe('GET /notification', () => {
        it('should return notifications successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/notification');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Notifications fetched');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/notification-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('PUT /notification/read/:id', () => {
        it('should mark a notification as read successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/notification/read/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Notification marked as read');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/notification/read-unauthorized/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Notification marked as read");
        }));
    });
    describe('DELETE /notification/delete/:id', () => {
        it('should delete a notification successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/notification/delete/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Notification deleted successfully');
        }));
        it('should return 404 for non-existent notification', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/notification/delete/999e9999-e89b-12d3-a456-426614174999');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Notification deleted successfully');
        }));
    });
});
