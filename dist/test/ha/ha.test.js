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
const ha_controller_1 = require("../../modules/ha/ha.controller");
const ha_service_1 = require("../../modules/ha/ha.service");
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
// Setup in-memory Express app
let app;
let haController;
let haService;
beforeAll(() => {
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Mock HaService methods to return predefined responses
    haService = new ha_service_1.HaService();
    globals_1.jest.spyOn(haService, 'forgotPassword').mockImplementation((email, secretWord) => __awaiter(void 0, void 0, void 0, function* () {
        if (email !== 'test@rub.edu.bt')
            throw new Error('Invalid email');
        return { emailId: 'email-id', url: 'http://example.com/reset' };
    }));
    globals_1.jest.spyOn(haService, 'toggleAvailability').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return false; }));
    globals_1.jest.spyOn(haService, 'getHaDetails').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
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
        ];
    }));
    haController = new ha_controller_1.HaController(haService);
    // Mock authenticateJWT middleware
    const mockAuthMiddleware = (userType) => (req, res, next) => {
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
    globals_1.jest.clearAllMocks();
});
// Integration tests for HaController
describe('HaController Integration Tests', () => {
    describe('POST /ha/forgot-password', () => {
        it('should send password reset email successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/ha/forgot-password').send({
                email: 'test@rub.edu.bt',
                secret_word: 'secret123',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Password reset Email send');
        }));
    });
    describe('PUT /ha/toggle-availability', () => {
        it('should toggle availability successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/ha/toggle-availability');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Availability updated successfully.');
            expect(response.body.is_available).toBe(false);
        }));
        it('should return 401 for non-HA user', () => __awaiter(void 0, void 0, void 0, function* () {
            app.put('/ha/toggle-availability-unauthorized', (req, res, next) => {
                req.user = { id: 'test-user-id', userType: 'STUDENT' };
                next();
            }, haController.toggleAvailability);
            const response = yield (0, supertest_1.default)(app).put('/ha/toggle-availability-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('GET /ha/get-ha-details', () => {
        it('should retrieve HA details successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/ha/get-ha-details');
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
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/ha/get-ha-details-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
});
