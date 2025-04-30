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
const illness_controller_1 = require("../../modules/illness/illness.controller");
const illness_service_1 = require("../../modules/illness/illness.service");
const catch_errors_1 = require("../../common/utils/catch-errors");
// Setup in-memory Express app
let app;
let illnessController;
let illnessService;
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
    // Mock IllnessService to return predefined data
    illnessService = new illness_service_1.IllnessService();
    globals_1.jest.spyOn(illnessService, 'createIllness').mockImplementation((data) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: data.name,
            type: data.type,
            description: data.description || null,
            category_id: data.category_id || null,
            created_at: '2025-04-01T00:00:00.000Z',
        });
    }));
    globals_1.jest.spyOn(illnessService, 'getIllnesses').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Diabetes',
                type: 'NON_COMMUNICABLE',
                description: 'Chronic condition affecting blood sugar levels.',
                category_id: '223e4567-e89b-12d3-a456-426614174001',
                created_at: '2025-04-01T00:00:00.000Z',
            },
        ];
    }));
    globals_1.jest.spyOn(illnessService, 'getIllnessById').mockImplementation((id) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Illness not found');
        }
        return {
            id,
            name: 'Diabetes',
            type: 'NON_COMMUNICABLE',
            description: 'Chronic condition affecting blood sugar levels.',
            category_id: '223e4567-e89b-12d3-a456-426614174001',
            created_at: '2025-04-01T00:00:00.000Z',
        };
    }));
    globals_1.jest.spyOn(illnessService, 'updateIllness').mockImplementation((id, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Illness not found');
        }
        return {
            id,
            name: data.name || 'Diabetes',
            type: data.type || 'NON_COMMUNICABLE',
            description: data.description || 'Chronic condition affecting blood sugar levels.',
            category_id: data.category_id || '223e4567-e89b-12d3-a456-426614174001',
            created_at: '2025-04-01T00:00:00.000Z',
        };
    }));
    globals_1.jest.spyOn(illnessService, 'deleteIllness').mockImplementation((id) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Illness not found');
        }
    }));
    illnessController = new illness_controller_1.IllnessController(illnessService);
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
    app.post('/illness/create', mockAuthMiddleware('HA'), illnessController.createIllness);
    app.get('/illness', mockAuthMiddleware('HA'), illnessController.getIllnesses);
    app.get('/illness/:id', mockAuthMiddleware('HA'), illnessController.getIllnessById);
    app.put('/illness/update/:id', mockAuthMiddleware('HA'), illnessController.updateIllness);
    app.delete('/illness/delete/:id', mockAuthMiddleware('HA'), illnessController.deleteIllness);
    app.post('/illness/create-unauthorized', mockAuthMiddleware(null), illnessController.createIllness);
    app.get('/illness-unauthorized', mockAuthMiddleware(null), illnessController.getIllnesses);
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
// Integration tests for IllnessController
describe('IllnessController Integration Tests', () => {
    describe('POST /illness/create', () => {
        it('should create an illness successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/illness/create').send({
                name: 'Diabetes',
                type: 'NON_COMMUNICABLE',
                description: 'Chronic condition affecting blood sugar levels.',
                category_id: '223e4567-e89b-12d3-a456-426614174001',
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Illness added successfully');
            expect(response.body.illness).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Diabetes',
                type: 'NON_COMMUNICABLE',
                description: 'Chronic condition affecting blood sugar levels.',
                category_id: '223e4567-e89b-12d3-a456-426614174001',
                created_at: '2025-04-01T00:00:00.000Z',
            });
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/illness/create-unauthorized').send({
                name: 'Diabetes',
                type: 'NON_COMMUNICABLE',
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Illness added successfully");
        }));
    });
    describe('GET /illness', () => {
        it('should return illnesses successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/illness');
            expect(response.status).toBe(200);
            expect(response.body.illnesses).toEqual([
                {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'Diabetes',
                    type: 'NON_COMMUNICABLE',
                    description: 'Chronic condition affecting blood sugar levels.',
                    category_id: '223e4567-e89b-12d3-a456-426614174001',
                    created_at: '2025-04-01T00:00:00.000Z',
                },
            ]);
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/illness-unauthorized');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('GET /illness/:id', () => {
        it('should return illness by ID successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/illness/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.illness).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Diabetes',
                type: 'NON_COMMUNICABLE',
                description: 'Chronic condition affecting blood sugar levels.',
                category_id: '223e4567-e89b-12d3-a456-426614174001',
                created_at: '2025-04-01T00:00:00.000Z',
            });
        }));
        it('should return 404 for non-existent illness', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/illness/non-existent-id');
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('PUT /illness/update/:id', () => {
        it('should update an illness successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/illness/update/123e4567-e89b-12d3-a456-426614174000').send({
                name: 'Type 2 Diabetes',
                type: 'NON_COMMUNICABLE',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Illness updated successfully');
            expect(response.body.updatedIllness).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Type 2 Diabetes',
                type: 'NON_COMMUNICABLE',
                description: 'Chronic condition affecting blood sugar levels.',
                category_id: '223e4567-e89b-12d3-a456-426614174001',
                created_at: '2025-04-01T00:00:00.000Z',
            });
        }));
        it('should return 404 for non-existent illness', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/illness/update/non-existent-id').send({
                name: 'Type 2 Diabetes',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('DELETE /illness/delete/:id', () => {
        it('should delete an illness successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/illness/delete/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Illness deleted successfully');
        }));
        it('should return 404 for non-existent illness', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/illness/delete/non-existent-id');
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
    });
});
