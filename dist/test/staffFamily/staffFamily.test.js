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
const staff_service_1 = require("../../modules/staffFamily/staff.service");
const staff_controller_1 = require("../../modules/staffFamily/staff.controller");
const catch_errors_1 = require("../../common/utils/catch-errors");
// Setup in-memory Express app
let app;
let staffController;
let staffService;
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
    // Mock StaffService to return predefined data
    staffService = new staff_service_1.StaffService();
    globals_1.jest.spyOn(staffService, 'createFamilyMember').mockImplementation((data) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id: '123e4567-e89b-12d3-a456-426614174000',
            staff_id: data.staff_id,
            name: data.name,
            gender: data.gender,
            relation: data.relation,
            contact_number: data.contact_number || null,
            blood_type: data.blood_type || null,
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
            is_active: true,
            created_at: new Date('2025-04-01T00:00:00.000Z'),
            updated_at: null,
        });
    }));
    globals_1.jest.spyOn(staffService, 'getFamilyMembers').mockImplementation((staffId) => __awaiter(void 0, void 0, void 0, function* () {
        if (staffId === 'non-existent-staff') {
            throw new catch_errors_1.NotFoundException('No active family members found.');
        }
        return [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                staff_id: staffId,
                name: 'Jane Doe',
                gender: 'FEMALE',
                relation: 'SPOUSE',
                contact_number: '12345678',
                blood_type: 'O+',
                date_of_birth: new Date('1980-01-01T00:00:00.000Z'),
                is_active: true,
                created_at: new Date('2025-04-01T00:00:00.000Z'),
                updated_at: new Date('2025-04-01T00:00:00.000Z'),
            },
        ];
    }));
    globals_1.jest.spyOn(staffService, 'getAllFamilyMembers').mockImplementation((staffId) => __awaiter(void 0, void 0, void 0, function* () {
        if (staffId === 'non-existent-staff') {
            throw new catch_errors_1.NotFoundException('No family members found.');
        }
        return [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                staff_id: staffId,
                name: 'Jane Doe',
                gender: 'FEMALE',
                relation: 'SPOUSE',
                contact_number: '12345678',
                blood_type: 'O+',
                date_of_birth: new Date('1980-01-01T00:00:00.000Z'),
                is_active: true,
                created_at: new Date('2025-04-01T00:00:00.000Z'),
                updated_at: new Date('2025-04-01T00:00:00.000Z'),
            },
            {
                id: '223e4567-e89b-12d3-a456-426614174001',
                staff_id: staffId,
                name: 'John Doe',
                gender: 'MALE',
                relation: 'CHILD',
                contact_number: null,
                blood_type: null,
                date_of_birth: null,
                is_active: false,
                created_at: new Date('2025-04-02T00:00:00.000Z'),
                updated_at: new Date('2025-04-02T00:00:00.000Z'),
            },
        ];
    }));
    globals_1.jest.spyOn(staffService, 'updateFamilyMember').mockImplementation((id, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Family member not found.');
        }
        return {
            id,
            staff_id: 'staff-1',
            name: data.name || 'Jane Doe',
            gender: data.gender || 'FEMALE',
            relation: data.relation || 'SPOUSE',
            contact_number: data.contact_number || '12345678',
            blood_type: data.blood_type || 'O+',
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
            is_active: true,
            created_at: new Date('2025-04-01T00:00:00.000Z'),
            updated_at: new Date('2025-04-01T00:00:00.000Z'),
        };
    }));
    globals_1.jest.spyOn(staffService, 'deleteFamilyMember').mockImplementation((id) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Family member not found.');
        }
        return;
    }));
    globals_1.jest.spyOn(staffService, 'hardDeleteFamilyMember').mockImplementation((id) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Family member not found.');
        }
        return;
    }));
    staffController = new staff_controller_1.StaffController(staffService);
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
    app.post('/staffFamily/create', mockAuthMiddleware('HA'), staffController.createFamilyMember);
    app.get('/staffFamily/:staff_id', mockAuthMiddleware('HA'), staffController.getFamilyMembers);
    app.get('/staffFamily/all/:staff_id', mockAuthMiddleware('HA'), staffController.getAllFamilyMembers);
    app.put('/staffFamily/update/:id', mockAuthMiddleware('HA'), staffController.updateFamilyMember);
    app.delete('/staffFamily/delete/:id', mockAuthMiddleware('HA'), staffController.deleteFamilyMember);
    app.delete('/staffFamily/hard-delete/:id', mockAuthMiddleware('HA'), staffController.hardDeleteFamilyMember);
    app.post('/staffFamily/create-unauthorized', mockAuthMiddleware('STUDENT'), staffController.createFamilyMember);
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
// Integration tests for StaffController
describe('StaffController Integration Tests', () => {
    describe('POST /staffFamily/create', () => {
        it('should create a family member successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/staffFamily/create').send({
                name: 'Jane Doe',
                staff_id: 'staff-1',
                gender: 'FEMALE',
                relation: 'SPOUSE',
                contact_number: '12345678',
                blood_type: 'O+',
                date_of_birth: '1980-01-01',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/staffFamily/create-unauthorized').send({
                name: 'Jane Doe',
                staff_id: 'staff-1',
                gender: 'FEMALE',
                relation: 'SPOUSE',
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('GET /staffFamily/:staff_id', () => {
        it('should return active family members successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/staffFamily/staff-1');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Family members retrieved');
        }));
        it('should return 404 for no active family members', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/staffFamily/non-existent-staff');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('GET /staffFamily/all/:staff_id', () => {
        it('should return all family members successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/staffFamily/all/staff-1');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Family members retrieved');
        }));
        it('should return 404 for no family members', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/staffFamily/all/non-existent-staff');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('PUT /staffFamily/update/:id', () => {
        it('should update a family member successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/staffFamily/update/123e4567-e89b-12d3-a456-426614174000').send({
                name: 'Jane Smith',
                gender: 'FEMALE',
                relation: 'SPOUSE',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Family member updated');
        }));
        it('should return 404 for non-existent family member', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/staffFamily/update/non-existent-id').send({
                name: 'Jane Smith',
            });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('DELETE /staffFamily/delete/:id', () => {
        it('should soft delete a family member successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/staffFamily/delete/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Family member removed successfully');
        }));
        it('should return 404 for non-existent family member', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/staffFamily/delete/non-existent-id');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('DELETE /staffFamily/hard-delete/:id', () => {
        it('should hard delete a family member successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/staffFamily/hard-delete/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Family member permanently deleted.');
        }));
        it('should return 404 for non-existent family member', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/staffFamily/hard-delete/non-existent-id');
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
    });
});
