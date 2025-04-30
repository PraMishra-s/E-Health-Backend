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
const session_controller_1 = require("../../modules/session/session.controller");
const session_service_1 = require("../../modules/session/session.service");
const catch_errors_1 = require("../../common/utils/catch-errors");
// Setup in-memory Express app
let app;
let sessionController;
let sessionService;
// Mock the Redis module before any imports that use it
globals_1.jest.mock('@upstash/redis', () => {
    return {
        Redis: globals_1.jest.fn().mockImplementation(() => {
            return {
                get: globals_1.jest.fn(),
                set: globals_1.jest.fn(),
                del: globals_1.jest.fn(),
                // Add any other Redis methods you use in your code
            };
        }),
    };
});
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
    // Mock SessionService to return predefined data
    sessionService = new session_service_1.SessionService();
    globals_1.jest.spyOn(sessionService, 'getAllSessionsBySessionId').mockImplementation((userId, sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                user_id: userId,
                user_agent: 'Mozilla/5.0',
                created_at: new Date('2025-04-01T00:00:00.000Z'),
                expired_at: new Date('2025-04-08T00:00:00.000Z'),
                isCurrent: true,
            },
        ];
    }));
    globals_1.jest.spyOn(sessionService, 'getSessionById').mockImplementation((sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        if (sessionId === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Session not found.');
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
    }));
    globals_1.jest.spyOn(sessionService, 'deleteSession').mockImplementation((sessionId, userId) => __awaiter(void 0, void 0, void 0, function* () {
        if (sessionId === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Session not found or unauthorized to delete.');
        }
    }));
    globals_1.jest.spyOn(sessionService, 'deleteAllSessions').mockImplementation((userId) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            message: 'All sessions removed successfully',
        });
    }));
    sessionController = new session_controller_1.SessionController(sessionService);
    // Mock authentication middleware
    const mockAuthMiddleware = (userType, userId = null, sessionId = null) => (req, res, next) => {
        if (userType && userId) {
            req.user = { id: userId, userType };
            req.sessionId = sessionId || '123e4567-e89b-12d3-a456-426614174000';
        }
        else {
            req.user = null;
            req.sessionId = null;
        }
        next();
    };
    // Mock clearAuthenticationCookies
    const mockClearCookies = (res) => {
        res.clearCookie = globals_1.jest.fn().mockReturnValue(res);
        return res;
    };
    // Register routes
    app.get('/session/all', mockAuthMiddleware('STUDENT', '223e4567-e89b-12d3-a456-426614174001'), sessionController.getAllSession);
    app.get('/session', mockAuthMiddleware('STUDENT', '223e4567-e89b-12d3-a456-426614174001'), sessionController.getSession);
    app.delete('/session/:id', mockAuthMiddleware('STUDENT', '223e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174000'), (req, res, next) => {
        if (req.params.id === '123e4567-e89b-12d3-a456-426614174000') {
            mockClearCookies(res);
        }
        next();
    }, sessionController.deleteSession);
    app.delete('/session/delete/all', mockAuthMiddleware('STUDENT', '223e4567-e89b-12d3-a456-426614174001'), (req, res, next) => {
        mockClearCookies(res);
        next();
    }, sessionController.deleteAllSessions);
    app.get('/session/all-unauthorized', mockAuthMiddleware(null, null, null), sessionController.getAllSession);
    app.get('/session-unauthorized', mockAuthMiddleware(null, null, null), sessionController.getSession);
    app.delete('/session/non-existent-id', mockAuthMiddleware('STUDENT', '223e4567-e89b-12d3-a456-426614174001'), sessionController.deleteSession);
    app.delete('/session/delete/all-unauthorized', mockAuthMiddleware(null, null, null), sessionController.deleteAllSessions);
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
// Integration tests for SessionController
describe('SessionController Integration Tests', () => {
    describe('GET /session/all', () => {
        it('should retrieve all sessions successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/session/all');
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
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/session/all-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('GET /session', () => {
        it('should retrieve current session successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/session');
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
        }));
        it('should return 404 for missing session ID', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/session-unauthorized');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('DELETE /session/:id', () => {
        it('should delete session successfully and clear cookies for current session', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/session/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Session removed successfully and User logout.');
        }));
        it('should return 404 for non-existent session', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/session/non-existent-id');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('DELETE /session/delete/all', () => {
        it('should delete all sessions successfully and clear cookies', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/session/delete/all');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('All Session removed successfully and user logged out.');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/session/delete/all-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
});
