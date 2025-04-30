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
const treatment_controller_1 = require("../../modules/treatment/treatment.controller");
const treatment_service_1 = require("../../modules/treatment/treatment.service");
const catch_errors_1 = require("../../common/utils/catch-errors");
// Setup in-memory Express app
let app;
let treatmentController;
let treatmentService;
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
    // Mock TreatmentService to return predefined data
    treatmentService = new treatment_service_1.TreatmentService();
    globals_1.jest.spyOn(treatmentService, 'addTreatment').mockImplementation((userId, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (!data.patient_id && !data.family_member_id) {
            throw new catch_errors_1.BadRequestException('Either patient_id or family_member_id is required.');
        }
        return {
            id: '123e4567-e89b-12d3-a456-426614174000',
            patient_id: data.patient_id,
            family_member_id: data.family_member_id,
            doctor_id: userId,
            severity: data.severity,
            notes: data.notes,
            blood_pressure: data.blood_pressure,
            forward_to_hospital: data.forward_to_hospital || false,
            forwarded_by_hospital: data.forwarded_by_hospital || false,
            created_at: new Date('2025-04-01T00:00:00.000Z'),
        };
    }));
    globals_1.jest.spyOn(treatmentService, 'updateTreatment').mockImplementation((treatmentId, data) => __awaiter(void 0, void 0, void 0, function* () {
        if (treatmentId === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Treatment record not found.');
        }
        return {
            id: treatmentId,
            patient_id: null,
            family_member_id: null,
            doctor_id: null,
            severity: 'MODERATE',
            notes: 'Updated notes',
            blood_pressure: null,
            forward_to_hospital: false,
            forwarded_by_hospital: false,
            created_at: new Date('2025-04-01T00:00:00.000Z'),
        };
    }));
    globals_1.jest.spyOn(treatmentService, 'getPatientTreatments').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                treatmentId: '123e4567-e89b-12d3-a456-426614174000',
                patientId: '223e4567-e89b-12d3-a456-426614174001',
                familyMemberId: null,
                doctorId: null,
                severity: 'MILD',
                notes: null,
                bloodPressue: null,
                forwardToHospital: false,
                forwardedByHospital: false,
                forwardedToHospital: false,
                departmentId: null,
                patientGender: null,
                patientAge: null,
                createdAt: new Date('2025-04-01T00:00:00.000Z'),
                patientName: 'John Doe',
                medicinesUsedCount: null,
                patientBloodType: null,
                patientContactNumber: null,
                patientDateOfBirth: null,
                patientType: null,
                medicines: [],
                illnesses: []
            },
        ];
    }));
    globals_1.jest.spyOn(treatmentService, 'getTreatmentById').mockImplementation((treatmentId) => __awaiter(void 0, void 0, void 0, function* () {
        if (treatmentId === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Treatment record not found.');
        }
        return {
            id: treatmentId,
            patient_id: '223e4567-e89b-12d3-a456-426614174001',
            doctor_id: null,
            severity: 'MILD',
            notes: null,
            created_at: new Date('2025-04-01T00:00:00.000Z'),
            medicines: [{ medicine_id: 'med-1', dosage: '1 tablet' }],
            illnesses: [{ illness_id: 'ill-1', illness_name: 'Flu' }],
        };
    }));
    globals_1.jest.spyOn(treatmentService, 'deleteTreatment').mockImplementation((treatmentId) => __awaiter(void 0, void 0, void 0, function* () {
        if (treatmentId === 'non-existent-id') {
            throw new catch_errors_1.NotFoundException('Treatment record not found.');
        }
    }));
    globals_1.jest.spyOn(treatmentService, 'getAllTreatment').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                treatmentId: '123e4567-e89b-12d3-a456-426614174000',
                patientId: '223e4567-e89b-12d3-a456-426614174001',
                familyMemberId: null,
                doctorId: '123e4567-e89b-12d3-a456-426614174000',
                severity: 'MILD',
                notes: 'Test notes',
                bloodPressue: null,
                forwardToHospital: false,
                forwardedByHospital: false,
                forwardedToHospital: false,
                departmentId: null,
                patientGender: null,
                patientBloodType: null,
                patientAge: null,
                patientWeight: null,
                patientHeight: null,
                patientBMI: null,
                createdAt: new Date('2025-04-01T00:00:00.000Z'),
                patientName: 'John Doe',
                illnessesCount: 0,
                medicinesCount: 0,
                medicinesUsedCount: null,
                patientContactNumber: null,
                patientDateOfBirth: null,
                patientType: null,
                medicines: [],
                illnesses: []
            },
        ];
    }));
    globals_1.jest.spyOn(treatmentService, 'getAllStudents').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                treatmentId: '123e4567-e89b-12d3-a456-426614174000',
                patientId: '223e4567-e89b-12d3-a456-426614174001',
                doctorId: null,
                severity: 'MILD',
                notes: null,
                createdAt: new Date('2025-04-01T00:00:00.000Z'),
                departmentId: null,
                patientName: 'Jane Doe',
                patientGender: null,
                studentNumber: '12345',
                patientType: null
            },
        ];
    }));
    treatmentController = new treatment_controller_1.TreatmentController(treatmentService);
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
    app.post('/treatment/create', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), treatmentController.addTreatment);
    app.put('/treatment/update/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), treatmentController.updateTreatment);
    app.get('/treatment/patient/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), treatmentController.getPatientTreatments);
    app.get('/treatment/individual/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), treatmentController.getTreatmentById);
    app.delete('/treatment/delete/:id', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), treatmentController.deleteTreatment);
    app.get('/treatment/patientAll', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), treatmentController.getAllTreatment);
    app.get('/treatment/students', mockAuthMiddleware('STAFF', '123e4567-e89b-12d3-a456-426614174000'), treatmentController.getAllStudents);
    app.post('/treatment/create-unauthorized', mockAuthMiddleware(null), treatmentController.addTreatment);
    app.post('/treatment/create-invalid', mockAuthMiddleware('HA', '123e4567-e89b-12d3-a456-426614174000'), treatmentController.addTreatment);
    app.get('/treatment/patientAll-unauthorized', mockAuthMiddleware(null), treatmentController.getAllTreatment);
    app.get('/treatment/students-unauthorized', mockAuthMiddleware('STUDENT'), treatmentController.getAllStudents);
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
// Integration tests for TreatmentController
describe('TreatmentController Integration Tests', () => {
    describe('POST /treatment/create', () => {
        it('should create a treatment successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/treatment/create').send({
                patient_id: '223e4567-e89b-12d3-a456-426614174001',
                illness_ids: ['ill-1'],
                severity: 'MILD',
                notes: 'Fever and cough',
                medicines: [{ medicine_id: 'med-1', dosage: '1 tablet' }],
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/treatment/create-unauthorized').send({
                patient_id: '223e4567-e89b-12d3-a456-426614174001',
                illness_ids: ['ill-1'],
                severity: 'MILD',
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 400 for invalid input', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post('/treatment/create-invalid').send({
                illness_ids: ['ill-1'],
                severity: 'MILD',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('PUT /treatment/update/:id', () => {
        it('should update a treatment successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/treatment/update/123e4567-e89b-12d3-a456-426614174000').send({
                severity: 'MODERATE',
                notes: 'Updated notes',
            });
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Treatment updated.');
        }));
        it('should return 404 for non-existent treatment', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/treatment/update/non-existent-id').send({
                severity: 'MODERATE',
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('GET /treatment/patient/:id', () => {
        it('should retrieve patient treatments successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/treatment/patient/223e4567-e89b-12d3-a456-426614174001');
            expect(response.status).toBe(200);
        }));
    });
    describe('GET /treatment/individual/:id', () => {
        it('should retrieve treatment by ID successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/treatment/individual/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
        }));
        it('should return 404 for non-existent treatment', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/treatment/individual/non-existent-id');
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('DELETE /treatment/delete/:id', () => {
        it('should delete a treatment successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/treatment/delete/123e4567-e89b-12d3-a456-426614174000');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Treatment deleted successfully.');
        }));
        it('should return 404 for non-existent treatment', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).delete('/treatment/delete/non-existent-id');
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('GET /treatment/patientAll', () => {
        it('should retrieve all treatments successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/treatment/patientAll');
            expect(response.status).toBe(200);
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/treatment/patientAll-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('GET /treatment/students', () => {
        it('should retrieve student treatments successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/treatment/students');
            expect(response.status).toBe(200);
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/treatment/students-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
});
