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
const mentalCase_controller_1 = require("../../modules/mental_cases/mentalCase.controller");
const mentalCase_service_1 = require("../../modules/mental_cases/mentalCase.service");
globals_1.jest.mock('../../database/drizzle', () => ({
    db: {
        query: globals_1.jest.fn(),
        select: globals_1.jest.fn(),
        // Add any other database methods that your service uses
    }
}));
// Setup in-memory Express app
let app;
let mentalController;
let mentalService;
beforeAll(() => {
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Mock MentalService to return predefined data
    mentalService = new mentalCase_service_1.MentalService();
    globals_1.jest.spyOn(mentalService, 'getAllCases').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return [
            {
                case_id: 'case-1',
                illness_id: 'illness-1',
                treatment_id: 'treatment-1',
                action_taken: 'Counseling session',
                created_at: new Date(),
                patient_type: 'COLLEGE_USER',
                name: 'John Doe',
                gender: 'MALE',
                contact_number: '12345678',
                std_year: 2,
                department_id: 'dept-1',
                email: 'john@rub.edu.bt',
            },
            {
                case_id: 'case-2',
                illness_id: 'illness-2',
                treatment_id: 'treatment-2',
                action_taken: 'Family consultation',
                created_at: new Date(),
                patient_type: 'STAFF_FAMILY',
                name: 'Jane Smith',
                gender: 'FEMALE',
                contact_number: '87654321',
                department_id: null,
                email: null,
            },
        ];
    }));
    globals_1.jest.spyOn(mentalService, 'updateCase').mockImplementation((id, data) => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            id,
            treatment_id: null,
            user_id: null,
            family_member_id: null,
            illness_id: null,
            action_taken: data.action_taken,
            is_resolved: data.is_resolved,
            created_at: new Date(),
            updated_at: new Date()
        });
    }));
    mentalController = new mentalCase_controller_1.MentalController(mentalService);
    // Mock authenticateJWT middleware
    const mockAuthMiddleware = (userType) => (req, res, next) => {
        req.user = { id: 'test-user-id', userType };
        next();
    };
    // Register routes
    app.get('/mental_cases', mockAuthMiddleware('HA'), mentalController.getAllCases);
    app.get('/mental_cases-unauthorized', mockAuthMiddleware('STUDENT'), mentalController.getAllCases);
    app.put('/mental_cases/update/:id', mockAuthMiddleware('HA'), mentalController.updateCase);
    app.put('/mental_cases/update-unauthorized/:id', mockAuthMiddleware('STUDENT'), mentalController.updateCase);
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
// Integration tests for MentalController
describe('MentalController Integration Tests', () => {
    describe('GET /mental_cases', () => {
        it('should return mental health cases successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/mental_cases');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Cases retrieved successfully');
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/mental_cases-unauthorized');
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
    describe('PUT /mental_cases/update/:id', () => {
        it('should update a mental health case successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/mental_cases/update/case-1').send({
                action_taken: 'Follow-up session',
                is_resolved: true,
            });
            expect(response.status).toBe(500);
            expect(response.body.message).toBe(undefined);
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).put('/mental_cases/update-unauthorized/case-1').send({
                action_taken: 'Follow-up session',
                is_resolved: true,
            });
            expect(response.status).toBe(401);
            expect(response.body.message).toBe(undefined);
        }));
    });
});
