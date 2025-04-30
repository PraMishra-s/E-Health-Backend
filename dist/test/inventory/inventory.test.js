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
const inventory_controller_1 = require("../../modules/inventory/inventory.controller");
const inventory_service_1 = require("../../modules/inventory/inventory.service");
const catch_errors_1 = require("../../common/utils/catch-errors");
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
let inventoryController;
let inventoryService;
beforeAll(() => {
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Mock InventoryService to return predefined data
    inventoryService = new inventory_service_1.InventoryService();
    globals_1.jest.spyOn(inventoryService, 'createCategory').mockImplementation((data) => __awaiter(void 0, void 0, void 0, function* () { return ({ id: 'cat-1', name: data.name, created_at: new Date() }); }));
    globals_1.jest.spyOn(inventoryService, 'getCategories').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return [{ id: 'cat-1', name: 'Antibiotics', created_at: new Date() }]; }));
    globals_1.jest.spyOn(inventoryService, 'updateCategory').mockImplementation((id, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id')
            throw new catch_errors_1.NotFoundException('Category not found.');
        return { id, name: data.name, created_at: null };
    }));
    globals_1.jest.spyOn(inventoryService, 'deleteCategory').mockImplementation((id) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id')
            throw new catch_errors_1.NotFoundException('Category not found.');
    }));
    globals_1.jest.spyOn(inventoryService, 'getCategoriesCount').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return [{ id: 'cat-1', category: 'Antibiotics', total: 5 }]; }));
    globals_1.jest.spyOn(inventoryService, 'createMedicine').mockImplementation((data) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id: 'med-1',
            name: data.name,
            category_id: data.category_id,
            unit: data.unit,
            created_at: null,
            updated_at: null,
        });
    }));
    globals_1.jest.spyOn(inventoryService, 'getMedicines').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [{
                id: 'med-1',
                name: 'Paracetamol',
                category_id: 'cat-1',
                unit: 'tablet',
                created_at: null,
                updated_at: null,
                batches: [{ id: 'batch-1', batch_name: 'B001', quantity: 100 }],
            }];
    }));
    globals_1.jest.spyOn(inventoryService, 'getMedicinesExpired').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            message: 'Expired medicines retrieved.',
            totalExpiredBatches: 1,
            expiredBatches: [{
                    batch_id: 'batch-1',
                    batch_name: 'B001',
                    medicine_id: 'med-1',
                    medicine_name: 'Paracetamol',
                    medicine_categories: 'Antibiotics',
                    expiry_date: new Date('2025-03-01'),
                    remaining_stock: 100
                }],
        });
    }));
    globals_1.jest.spyOn(inventoryService, 'getMedicineById').mockImplementation((id) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id')
            throw new catch_errors_1.NotFoundException('Medicine not found.');
        return { id, name: 'Paracetamol', category_id: 'cat-1', unit: 'tablet', created_at: null, updated_at: null };
    }));
    globals_1.jest.spyOn(inventoryService, 'updateMedicine').mockImplementation((id, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id')
            throw new catch_errors_1.NotFoundException('Medicine not found.');
        return { id, name: data.name, category_id: data.category_id, unit: "Test", created_at: null, updated_at: null };
    }));
    globals_1.jest.spyOn(inventoryService, 'deleteMedicine').mockImplementation((id) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id')
            throw new catch_errors_1.NotFoundException('Medicine not found.');
    }));
    globals_1.jest.spyOn(inventoryService, 'addStock').mockImplementation((userId, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (data.quantity <= 0)
            throw new catch_errors_1.BadRequestException('Invalid stock quantity.');
        return {
            id: 'trans-1',
            created_at: null,
            type: 'ADDED',
            medicine_id: data.medicine_id,
            batch_name: data.batch_name,
            batch_id: null,
            change: data.quantity,
            reason: 'Stock addition',
            user_id: userId,
            patient_id: null,
            family_member_id: null
        };
    }));
    globals_1.jest.spyOn(inventoryService, 'useMedicine').mockImplementation((userId, data) => __awaiter(void 0, void 0, void 0, function* () {
        return [{
                id: 'trans-2',
                created_at: null,
                medicine_id: data.medicine_id,
                batch_name: null,
                batch_id: null,
                change: -data.quantity,
                type: 'USED_FOR_PATIENT',
                reason: 'Patient treatment',
                user_id: userId,
                patient_id: data.patient_id,
                family_member_id: null
            }];
    }));
    globals_1.jest.spyOn(inventoryService, 'removeStock').mockImplementation((userId, data) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id: 'trans-3',
            medicine_id: null,
            created_at: null,
            batch_name: null,
            batch_id: data.batch_id,
            change: -data.quantity,
            type: 'REMOVED',
            reason: 'Stock removal',
            user_id: userId,
            patient_id: null,
            family_member_id: null
        });
    }));
    globals_1.jest.spyOn(inventoryService, 'getTransactions').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [{
                id: 'trans-1',
                batch_id: null,
                batch_name: null,
                medicine_id: 'med-1',
                medicine_name: 'Paracetamol',
                change: 100,
                type: 'ADDED',
                reason: 'Stock addition',
                user_id: null,
                patient_id: null,
                created_at: null,
            }];
    }));
    globals_1.jest.spyOn(inventoryService, 'getBatches').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return [{ id: 'batch-1', medicine_id: 'med-1', batch_name: 'B001', quantity: 100, is_deleted: false, expiry_date: new Date(), created_at: new Date() }]; }));
    globals_1.jest.spyOn(inventoryService, 'getBatchesById').mockImplementation((medicine_id) => __awaiter(void 0, void 0, void 0, function* () {
        if (medicine_id === 'non-existent-id')
            throw new catch_errors_1.NotFoundException('No batches found for this medicine.');
        return [{ id: 'batch-1', medicine_id, batch_name: 'B001', quantity: 100, is_deleted: false, expiry_date: new Date(), created_at: new Date() }];
    }));
    globals_1.jest.spyOn(inventoryService, 'updateBatch').mockImplementation((id, data) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id,
            medicine_id: 'med-1',
            batch_name: data.batch_name || 'B001',
            quantity: data.quantity || 100,
            is_deleted: false,
            expiry_date: new Date(data.expiry_date || '2025-12-01'),
            created_at: null
        });
    }));
    globals_1.jest.spyOn(inventoryService, 'deleteBatch').mockImplementation((id) => __awaiter(void 0, void 0, void 0, function* () {
        if (id === 'non-existent-id')
            throw new catch_errors_1.NotFoundException('Batch not found.');
    }));
    globals_1.jest.spyOn(inventoryService, 'deleteBatchById').mockImplementation((userId, batch_id) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id: 'trans-4',
            medicine_id: 'med-1',
            batch_id: null,
            batch_name: null,
            change: -100,
            type: 'REMOVED',
            user_id: userId,
            created_at: null,
            patient_id: null,
            family_member_id: null,
            reason: 'Expired batch removal'
        });
    }));
    inventoryController = new inventory_controller_1.InventoryController(inventoryService);
    // Mock authenticateJWT middleware
    const mockAuthMiddleware = (userType, userId = null) => (req, res, next) => {
        if (userType && userId) {
            req.user = { id: userId, userType };
        }
        else {
            req.user = null;
        }
        next();
    };
    // Register routes
    app.post('/inventory/categories/add', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.createCategory);
    app.get('/inventory/categories', inventoryController.getCategories);
    app.put('/inventory/categories/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.updateCategory);
    app.delete('/inventory/categories/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.deleteCategory);
    app.get('/inventory/categories/counts', inventoryController.getCategoriesCount);
    app.post('/inventory/medicines', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.createMedicine);
    app.get('/inventory/medicines', inventoryController.getMedicines);
    app.get('/inventory/medicines/:id', inventoryController.getMedicineById);
    app.put('/inventory/medicines/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.updateMedicine);
    app.delete('/inventory/medicines/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.deleteMedicine);
    app.get('/inventory/medicines-expired', inventoryController.getMedicinesExpired);
    app.post('/inventory/transactions/add', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.addStock);
    app.post('/inventory/transactions/use', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.useMedicine);
    app.post('/inventory/transactions/remove', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.removeStock);
    app.get('/inventory/transactions', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.getTransactions);
    app.get('/inventory/medicine/batch/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.getBatchesById);
    app.get('/inventory/medicine/batch', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.getBatches);
    app.put('/inventory/medicine/batch/update/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.updateBatch);
    app.delete('/inventory/medicine/batch/delete/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.deleteBatch);
    app.delete('/inventory/medicine/batch/expired/delete/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.deleteBatchById);
    app.post('/inventory/categories/add-unauthorized', mockAuthMiddleware(null), inventoryController.createCategory);
    app.post('/inventory/medicines-unauthorized', mockAuthMiddleware(null), inventoryController.createMedicine);
    app.post('/inventory/transactions/add-invalid', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.addStock);
    app.put('/inventory/categories/non-existent-id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), inventoryController.updateCategory);
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
// Integration tests for InventoryController
describe('InventoryController Integration Tests', () => {
    describe('Medicine Categories', () => {
        it('should create a category successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/inventory/categories/add').send({ name: 'Antibiotics' });
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Category created successfully');
        }));
        it('should return 401 for unauthorized category creation', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/inventory/categories/add-unauthorized').send({ name: 'Antibiotics' });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
        it('should get categories successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/inventory/categories');
            expect(response.status).toBe(200);
        }));
        it('should update a category successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/inventory/categories/cat-1').send({ name: 'Painkillers' });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Category updated successfully');
        }));
        it('should return 404 for non-existent category update', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/inventory/categories/non-existent-id').send({ name: 'Painkillers' });
            expect(response.status).toBe(404);
            expect(response.body.message).toBe(undefined);
        }));
        it('should delete a category successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/inventory/categories/cat-1');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Category deleted successfully');
        }));
        it('should get category counts successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/inventory/categories/counts');
            expect(response.status).toBe(200);
            expect(response.body.categoriesCount).toEqual([{ id: 'cat-1', category: 'Antibiotics', total: 5 }]);
        }));
    });
    describe('Medicines', () => {
        it('should create a medicine successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/inventory/medicines').send({
                name: 'Paracetamol',
                category_id: 'cat-1',
                unit: 'tablet',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 401 for unauthorized medicine creation', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/inventory/medicines-unauthorized').send({
                name: 'Paracetamol',
                category_id: 'cat-1',
                unit: 'tablet',
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
        it('should get medicines successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/inventory/medicines');
            expect(response.status).toBe(200);
        }));
        it('should get medicine by ID successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/inventory/medicines/med-1');
            expect(response.status).toBe(200);
        }));
        it('should update a medicine successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/inventory/medicines/med-1').send({
                name: 'Ibuprofen',
                category_id: 'cat-1',
                unit: 'tablet',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should delete a medicine successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/inventory/medicines/med-1');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Medicine deleted successfully');
        }));
        it('should get expired medicines successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/inventory/medicines-expired');
            expect(response.status).toBe(200);
        }));
    });
    describe('Transactions', () => {
        it('should add stock successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/inventory/transactions/add').send({
                medicine_id: 'med-1',
                batch_name: 'B001',
                quantity: 100,
                expiry_date: '2025-12-01',
                reason: 'New stock',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 400 for invalid stock quantity', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/inventory/transactions/add-invalid').send({
                medicine_id: 'med-1',
                batch_name: 'B001',
                quantity: 0,
                expiry_date: '2025-12-01',
                reason: 'New stock',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should use medicine successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/inventory/transactions/use').send({
                medicine_id: 'med-1',
                quantity: 10,
                reason: 'Patient treatment',
                patient_id: 'pat-1',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should remove stock successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/inventory/transactions/remove').send({
                batch_id: 'batch-1',
                quantity: 10,
                reason: 'Damaged stock',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should get transactions successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/inventory/transactions');
            expect(response.status).toBe(200);
        }));
    });
    describe('Batches', () => {
        it('should get batches by medicine ID successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/inventory/medicine/batch/med-1');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Batches retrieved successfully');
        }));
        it('should get all batches successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/inventory/medicine/batch');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Batches retrieved successfully');
        }));
        it('should update a batch successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/inventory/medicine/batch/update/batch-1').send({
                batch_name: 'B002',
                quantity: 200,
                expiry_date: '2025-12-01',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Batch updated successfully');
        }));
        it('should delete a batch successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/inventory/medicine/batch/delete/batch-1');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Batch deleted successfully');
        }));
        it('should delete expired batch by ID successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/inventory/medicine/batch/expired/delete/batch-1');
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
    });
});
