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
const catch_errors_1 = require("../../common/utils/catch-errors");
const user_controller_1 = require("../../modules/user/user.controller");
const user_service_1 = require("../../modules/user/user.service");
// Setup in-memory Express app
let app;
let userController;
let userService;
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
    // Mock UserService to return predefined data
    userService = new user_service_1.UserService();
    globals_1.jest.spyOn(userService, 'updateUser').mockImplementation((userId, data) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
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
        });
    }));
    globals_1.jest.spyOn(userService, 'getEmail').mockImplementation((email) => __awaiter(void 0, void 0, void 0, function* () {
        if (email === 'notfound@rub.edu.bt')
            return 'NOT_FOUND';
        if (email === 'ha@rub.edu.bt')
            return 'HA';
        return 'USER';
    }));
    globals_1.jest.spyOn(userService, 'updateProfilePic').mockImplementation((userId, data) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
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
        });
    }));
    globals_1.jest.spyOn(userService, 'changePassword').mockImplementation((userId, currentPassword) => __awaiter(void 0, void 0, void 0, function* () {
        if (currentPassword !== 'correctPassword') {
            throw new catch_errors_1.BadRequestException('Current password is incorrect.');
        }
    }));
    globals_1.jest.spyOn(userService, 'getUsers').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
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
        ];
    }));
    globals_1.jest.spyOn(userService, 'getProgrammes').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                programme_id: 'prog-1',
                programme_name: 'Computer Science',
            },
        ];
    }));
    globals_1.jest.spyOn(userService, 'changeUserType').mockImplementation((userId, type) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
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
        });
    }));
    globals_1.jest.spyOn(userService, 'getStaff').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                id: '223e4567-e89b-12d3-a456-426614174001',
                name: 'Jane Smith',
                gender: 'FEMALE',
                department_id: 'dept-2',
                userType: 'STAFF',
                contact_number: '87654321',
            },
        ];
    }));
    userController = new user_controller_1.UserController(userService);
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
    // Mock rateLimiter middleware (pass-through for tests)
    const mockRateLimiter = (req, res, next) => next();
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
    globals_1.jest.clearAllMocks();
});
// Integration tests for UserController
describe('UserController Integration Tests', () => {
    describe('PUT /users/update', () => {
        it('should update user profile successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/users/update').send({
                name: 'Jane Doe',
                gender: 'FEMALE',
                contact_number: '87654321',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User profile updated successfully');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/users/update-unauthorized').send({
                name: 'Jane Doe',
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized');
        }));
    });
    describe('POST /users/email', () => {
        it('should return user type successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/users/email').send({
                email: 'ha@rub.edu.bt',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User type retrieved successfully');
            expect(response.body.userType).toBe('HA');
        }));
        it('should return NOT_FOUND for non-existent email', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/users/email').send({
                email: 'notfound@rub.edu.bt',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User type retrieved successfully');
            expect(response.body.userType).toBe('NOT_FOUND');
        }));
    });
    describe('PUT /users/update-profile', () => {
        it('should update profile picture successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/users/update-profile').send({
                profile_url: 'https://example.com/profile.jpg',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User profile picture updated successfully');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/users/update-profile-unauthorized').send({
                profile_url: 'https://example.com/profile.jpg',
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized');
        }));
    });
    describe('PUT /users/change-password', () => {
        it('should change password successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/users/change-password').send({
                currentPassword: 'correctPassword',
                newPassword: 'newPassword123',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Password changed successfully.');
        }));
        it('should return 400 for incorrect current password', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/users/change-password').send({
                currentPassword: 'wrongPassword',
                newPassword: 'newPassword123',
            });
            expect(response.status).toBe(400);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('GET /users/users', () => {
        it('should return users successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/users/users');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Users Retrieved Succesfully');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/users/users-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized');
        }));
    });
    describe('GET /users/programmes', () => {
        it('should return programmes successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/users/programmes');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Programmes Retrieved Succesfully');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/users/programmes-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('PUT /users/change-userType/:id', () => {
        it('should change user type successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/users/change-userType/123e4567-e89b-12d3-a456-426614174000').send({
                type: 'STAFF',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('User Type Changed Succesfully');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/users/change-userType-unauthorized/123e4567-e89b-12d3-a456-426614174000').send({
                type: 'STAFF',
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized');
        }));
    });
    describe('GET /users/getStaff', () => {
        it('should return staff successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/users/getStaff');
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
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/users/getStaff-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe('Unauthorized');
        }));
    });
});
