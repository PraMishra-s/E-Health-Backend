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
const illnessCategory_controller_1 = require("../../modules/illness_category/illnessCategory.controller");
const illnessCategory_service_1 = require("../../modules/illness_category/illnessCategory.service");
// Setup in-memory Express app
let app;
let illnessCategoryController;
let illnessCategoryService;
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
    // Mock IllnessCategoryService to return predefined data
    illnessCategoryService = new illnessCategory_service_1.IllnessCategoryService();
    globals_1.jest.spyOn(illnessCategoryService, 'createCategory').mockImplementation((data) => __awaiter(void 0, void 0, void 0, function* () {
        if (data.name === 'Viral') {
            throw new Error('Category with this name already exists');
        }
        return {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: data.name,
            created_at: '2025-04-01T00:00:00.000Z',
        };
    }));
    globals_1.jest.spyOn(illnessCategoryService, 'getAllCategories').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Bacterial',
                created_at: '2025-04-01T00:00:00.000Z',
            },
            {
                id: '223e4567-e89b-12d3-a456-426614174001',
                name: 'Chronic',
                created_at: '2025-04-02T00:00:00.000Z',
            },
        ];
    }));
    globals_1.jest.spyOn(illnessCategoryService, 'updateCategory').mockImplementation((id, data) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id,
            name: data.name || 'Bacterial',
            created_at: '2025-04-01T00:00:00.000Z',
        });
    }));
    globals_1.jest.spyOn(illnessCategoryService, 'deleteCategory').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { }));
    illnessCategoryController = new illnessCategory_controller_1.IllnessCategoryController(illnessCategoryService);
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
    app.post('/illness_category/create', mockAuthMiddleware('HA'), illnessCategoryController.createCategory);
    app.get('/illness_category', mockAuthMiddleware('HA'), illnessCategoryController.getAllCategories);
    app.put('/illness_category/update/:id', mockAuthMiddleware('HA'), illnessCategoryController.updateCategory);
    app.delete('/illness_category/delete/:id', mockAuthMiddleware('HA'), illnessCategoryController.deleteCategory);
    app.post('/illness_category/create-unauthorized', mockAuthMiddleware(null), illnessCategoryController.createCategory);
    app.get('/illness_category-unauthorized', mockAuthMiddleware(null), illnessCategoryController.getAllCategories);
    app.put('/illness_category/update-unauthorized/:id', mockAuthMiddleware(null), illnessCategoryController.updateCategory);
    app.delete('/illness_category/delete-unauthorized/:id', mockAuthMiddleware(null), illnessCategoryController.deleteCategory);
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
// Integration tests for IllnessCategoryController
describe('IllnessCategoryController Integration Tests', () => {
    describe('POST /illness_category/create', () => {
        it('should create a category successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/illness_category/create').send({
                name: 'Bacterial',
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Category created successfully');
            expect(response.body.category).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Bacterial',
                created_at: '2025-04-01T00:00:00.000Z',
            });
        }));
        it('should return 400 for duplicate category name', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/illness_category/create').send({
                name: 'Viral',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/illness_category/create-unauthorized').send({
                name: 'Bacterial',
            });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Category created successfully');
        }));
    });
    describe('GET /illness_category', () => {
        it('should return categories successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/illness_category');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Categories retrieved successfully');
            expect(response.body.categories).toEqual([
                {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'Bacterial',
                    created_at: '2025-04-01T00:00:00.000Z',
                },
                {
                    id: '223e4567-e89b-12d3-a456-426614174001',
                    name: 'Chronic',
                    created_at: '2025-04-02T00:00:00.000Z',
                },
            ]);
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/illness_category-unauthorized');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Categories retrieved successfully');
        }));
    });
    describe('PUT /illness_category/update/:id', () => {
        it('should update a category successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/illness_category/update/123e4567-e89b-12d3-a456-426614174000').send({
                name: 'Fungal',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Category updated successfully');
            expect(response.body.updatedCategory).toEqual({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Fungal',
                created_at: '2025-04-01T00:00:00.000Z',
            });
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/illness_category/update-unauthorized/123e4567-e89b-12d3-a456-426614174000').send({
                name: 'Fungal',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Category updated successfully");
        }));
    });
    describe('DELETE /illness_category/delete/:id', () => {
        it('should delete a category successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/illness_category/delete/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Category deleted successfully');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/illness_category/delete-unauthorized/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Category deleted successfully');
        }));
    });
});
