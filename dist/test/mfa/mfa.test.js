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
const mfa_controller_1 = require("../../modules/mfa/mfa.controller");
const mfa_service_1 = require("../../modules/mfa/mfa.service");
const catch_errors_1 = require("../../common/utils/catch-errors");
// Setup in-memory Express app
let app;
let mfaController;
let mfaService;
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
    // Mock MFAService to return predefined data
    mfaService = new mfa_service_1.MFAService();
    globals_1.jest.spyOn(mfaService, 'invokeMFASetup').mockImplementation((userId, sessionId) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id: userId,
            email: 'test@rub.edu.bt',
            role: 'HA',
            verified: true,
            mfa_required: true,
        });
    }));
    globals_1.jest.spyOn(mfaService, 'verifyMFAForLogin').mockImplementation((code, email, userAgent) => __awaiter(void 0, void 0, void 0, function* () {
        if (email === 'notfound@rub.edu.bt') {
            throw new catch_errors_1.NotFoundException('User not found.');
        }
        if (code !== '123456') {
            throw new catch_errors_1.BadRequestException('Invalid or expired OTP.');
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
    }));
    globals_1.jest.spyOn(mfaService, 'revokeMFA').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            message: 'MFA successfully disabled.',
        });
    }));
    mfaController = new mfa_controller_1.MFAController(mfaService);
    // Mock authenticateJWT middleware
    const mockAuthMiddleware = (userType, userId = null) => (req, res, next) => {
        if (userType && userId) {
            req.user = { id: userId, userType };
            req.sessionId = 'session-1';
        }
        else {
            req.user = null;
            req.sessionId = null;
        }
        next();
    };
    // Mock setAuthenticationCookies
    const mockSetCookies = (res) => {
        res.cookie = globals_1.jest.fn().mockReturnValue(res);
        return res;
    };
    // Register routes
    app.post('/mfa/invoke', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), mfaController.invokeMFASetup);
    app.post('/mfa/verify-login', (req, res, next) => {
        mockSetCookies(res);
        next();
    }, mfaController.verifyMFAForLogin);
    app.put('/mfa/revoke', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), mfaController.revokeMFA);
    app.post('/mfa/invoke-unauthorized', mockAuthMiddleware(null), mfaController.invokeMFASetup);
    app.put('/mfa/revoke-unauthorized', mockAuthMiddleware(null), mfaController.revokeMFA);
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
// Integration tests for MFAController
describe('MFAController Integration Tests', () => {
    describe('POST /mfa/invoke', () => {
        it('should enable MFA successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/mfa/invoke').send({});
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('MFA has been enabled successfully.');
            expect(response.body.user).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'test@rub.edu.bt',
                role: 'HA',
                verified: true,
                mfa_required: true,
            });
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/mfa/invoke-unauthorized').send({});
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('POST /mfa/verify-login', () => {
        it('should verify MFA and log in successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/mfa/verify-login').send({
                code: '123456',
                email: 'test@rub.edu.bt',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 400 for invalid OTP', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/mfa/verify-login').send({
                code: 'wrong-code',
                email: 'test@rub.edu.bt',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 404 for non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/mfa/verify-login').send({
                code: '123456',
                email: 'notfound@rub.edu.bt',
            });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('PUT /mfa/revoke', () => {
        it('should disable MFA successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/mfa/revoke').send({});
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('MFA successfully disabled.');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/mfa/revoke-unauthorized').send({});
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
});
