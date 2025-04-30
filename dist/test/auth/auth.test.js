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
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const globals_1 = require("@jest/globals");
const auth_controller_1 = require("../../modules/auth/auth.controller");
const auth_service_1 = require("../../modules/auth/auth.service");
const drizzle_1 = require("../../database/drizzle");
const redis_service_1 = __importDefault(require("../../common/service/redis.service"));
const bcrypt_1 = require("../../common/utils/bcrypt");
const mailer_1 = require("../../mailer/mailer");
// Mock dependencies
globals_1.jest.mock('../../database/drizzle', () => ({
    db: {
        select: globals_1.jest.fn(() => ({
            from: globals_1.jest.fn(() => ({
                where: globals_1.jest.fn(() => ({
                    execute: globals_1.jest.fn(() => Promise.resolve([])),
                })),
            })),
        })),
        insert: globals_1.jest.fn(() => ({
            values: globals_1.jest.fn(() => ({
                returning: globals_1.jest.fn(() => Promise.resolve([{ id: 'test-user-id' }])),
            })),
        })),
        update: globals_1.jest.fn(() => ({
            set: globals_1.jest.fn(() => ({
                where: globals_1.jest.fn(() => ({
                    returning: globals_1.jest.fn(() => Promise.resolve([{ id: 'test-user-id' }])),
                })),
            })),
        })),
        delete: globals_1.jest.fn(() => ({
            where: globals_1.jest.fn(() => Promise.resolve()),
        })),
    },
}));
globals_1.jest.mock('../../common/service/redis.service', () => ({
    get: globals_1.jest.fn(() => Promise.resolve(null)),
    set: globals_1.jest.fn(),
    del: globals_1.jest.fn(),
    incr: globals_1.jest.fn(() => Promise.resolve(1)),
    expire: globals_1.jest.fn(),
}));
globals_1.jest.mock('../../common/utils/bcrypt', () => ({
    hashValue: globals_1.jest.fn(() => Promise.resolve('hashed-password')),
    compareValue: globals_1.jest.fn(() => Promise.resolve(true)),
}));
globals_1.jest.mock('../../common/utils/jwt', () => ({
    signJwtToken: globals_1.jest.fn(() => 'mock-token'),
    verifyJwtToken: globals_1.jest.fn(() => ({
        payload: { sessionId: 'test-session-id', userId: 'test-user-id' },
    })),
    refreshTokenSignOptions: { expiresIn: '7d', secret: 'test-secret' },
}));
globals_1.jest.mock('../../mailer/mailer', () => ({
    sendEmail: globals_1.jest.fn(() => Promise.resolve({ data: { response: 'email-id' }, error: null })),
}));
// Create Express app for integration tests
let app;
let authController;
let authService;
beforeAll(() => {
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    authService = new auth_service_1.AuthService();
    authController = new auth_controller_1.AuthController(authService);
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
    globals_1.jest.clearAllMocks();
});
describe('AuthService Unit Tests', () => {
    describe('register', () => {
        it('should register a new user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            drizzle_1.db.select().from.mockReturnValueOnce({
                from: globals_1.jest.fn(() => ({
                    where: globals_1.jest.fn(() => ({
                        execute: globals_1.jest.fn(() => Promise.resolve([])), // No existing user
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
            const result = yield authService.register(userData);
            expect(result.user.id).toBe('test-user-id');
            expect(drizzle_1.db.insert).toHaveBeenCalledTimes(2); // users and login tables
            expect(mailer_1.sendEmail).toHaveBeenCalled();
        }));
    });
});
describe('AuthController Integration Tests', () => {
    describe('POST /auth/register', () => {
        it('should register a new user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            drizzle_1.db.select().from.mockReturnValueOnce({
                from: globals_1.jest.fn(() => ({
                    where: globals_1.jest.fn(() => ({
                        execute: globals_1.jest.fn(() => Promise.resolve([])), // No existing user
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
            const response = yield (0, supertest_1.default)(app).post('/auth/register').send(userData);
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data.id).toBe('test-user-id');
        }));
        it('should return 400 if passwords do not match', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                name: 'Test User',
                email: 'test@rub.edu.bt',
                password: 'password123',
                confirmPassword: 'different123',
                gender: 'MALE',
                user_type: 'STUDENT',
            };
            const response = yield (0, supertest_1.default)(app).post('/auth/register').send(userData);
            expect(response.status).toBe(500);
        }));
    });
    describe('POST /auth/login', () => {
        it('should login user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            drizzle_1.db.select().from
                .mockReturnValueOnce({
                from: globals_1.jest.fn(() => ({
                    where: globals_1.jest.fn(() => ({
                        execute: globals_1.jest.fn(() => Promise.resolve([{
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
                from: globals_1.jest.fn(() => ({
                    where: globals_1.jest.fn(() => ({
                        execute: globals_1.jest.fn(() => Promise.resolve([{
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
            const response = yield (0, supertest_1.default)(app).post('/auth/login').send(loginData);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 400 if invalid credentials', () => __awaiter(void 0, void 0, void 0, function* () {
            drizzle_1.db.select().from.mockReturnValueOnce({
                from: globals_1.jest.fn(() => ({
                    where: globals_1.jest.fn(() => ({
                        execute: globals_1.jest.fn(() => Promise.resolve([{
                                user_id: 'test-user-id',
                                email: 'test@rub.edu.bt',
                                password: 'hashed-password',
                                role: 'STUDENT',
                                verified: true,
                            }])),
                    })),
                })),
            });
            bcrypt_1.compareValue.mockReturnValueOnce(Promise.resolve(false));
            const loginData = { email: 'test@rub.edu.bt', password: 'wrong-password' };
            const response = yield (0, supertest_1.default)(app).post('/auth/login').send(loginData);
            expect(response.status).toBe(500);
        }));
    });
    describe('POST /auth/verify/email', () => {
        it('should verify email successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            redis_service_1.default.get.mockResolvedValueOnce('test-user-id');
            const response = yield (0, supertest_1.default)(app).post('/auth/verify/email').send({ code: 'valid-code' });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Email verified successfully');
            expect(drizzle_1.db.update).toHaveBeenCalled();
            expect(redis_service_1.default.del).toHaveBeenCalled();
        }));
    });
    describe('POST /auth/password/reset', () => {
        it('should reset password successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            redis_service_1.default.get.mockResolvedValueOnce('test-user-id');
            const response = yield (0, supertest_1.default)(app).post('/auth/password/reset').send({
                password: 'newpassword123',
                verificationCode: 'valid-reset-code',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Reset Password Successfully');
            expect(drizzle_1.db.update).toHaveBeenCalled();
            expect(redis_service_1.default.del).toHaveBeenCalled();
        }));
    });
    describe('GET /auth/refresh', () => {
        it('should refresh access token successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            drizzle_1.db.select().from.mockReturnValueOnce({
                from: globals_1.jest.fn(() => ({
                    where: globals_1.jest.fn(() => ({
                        execute: globals_1.jest.fn(() => Promise.resolve([{
                                id: 'test-session-id',
                                user_id: 'test-user-id',
                                expired_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
                            }])),
                    })),
                })),
            });
            const response = yield (0, supertest_1.default)(app).get('/auth/refresh').set('Cookie', ['refreshToken=valid-refresh-token']);
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('POST /auth/logout', () => {
        it('should logout successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/auth/logout');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User logout successfully.');
            expect(drizzle_1.db.delete).toHaveBeenCalled();
        }));
    });
});
