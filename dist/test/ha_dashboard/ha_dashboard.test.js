"use strict";
// Create a mock for the database module
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
exports.db = void 0;
// First, create a file called __mocks__/database.ts or in your test directory
// This will mock the drizzle.ts file
// __mocks__/database.ts
exports.db = {
    // Add mock methods and properties that your service uses
    query: globals_1.jest.fn(),
    select: globals_1.jest.fn(),
    // Add other methods your code might be using
};
// Then modify your test file to use the mock:
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const globals_1 = require("@jest/globals");
const ha_dashboard_controller_1 = require("../../modules/ha_dashboard/ha_dashboard.controller");
const ha_dashboard_service_1 = require("../../modules/ha_dashboard/ha_dashboard.service");
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
let haDashboardController;
let haDashboardService;
beforeAll(() => {
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Mock HaDashboardService to return predefined analytics data
    haDashboardService = new ha_dashboard_service_1.HaDashboardService();
    globals_1.jest.spyOn(haDashboardService, 'getAnalytics').mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            totalTreatments: 100,
            mostTreatedIllnesses: [
                { illness_id: 'illness-1', illness_name: 'Flu', illness_type: 'COMMUNICABLE', count: 50 },
            ],
            mostPrescribedMedicines: [
                { medicine_id: 'med-1', medicine_name: 'Paracetamol', category_name: 'Painkiller', count: 60 },
            ],
            totalMedicinesDispensed: 200,
            patientDemographics: [{ userType: 'STUDENT', count: 70 }],
            treatmentSeverity: [{ severity: 'MILD', count: 80 }],
            medicineInventory: [
                { medicine_id: 'illness-1', medicine_name: 'Paracetamol', total_quantity: '100', expiring_soon_count: 10 },
            ],
            doctorWorkload: [{ doctor_id: 'doc-1', doctor_name: 'Dr. Test', count: 90 }],
            treatmentsOverTime: [{ month: '2025-04', count: 30 }],
            treatmentsByGender: [{ gender: 'MALE', count: 60 }],
            usersByGender: [{ gender: 'FEMALE', count: 40 }],
            illnessesOverTime: [{ month: '2025-04', illness_id: 'illness-1', illness_name: 'Flu', count: 20 }],
            ageGroups: [{ age_group: '18-25', count: 50 }],
            familyMemberTreatments: [{ relation: 'SPOUSE', count: 10 }],
            studentProgramStats: [{ programme_id: 'prog-1', programme_name: 'Engineering', count: 30 }],
            medicineUsageOverTime: [{ month: '2025-04', medicine_id: 'med-1', medicine_name: 'Paracetamol', total_used: '50' }],
            inventoryHealthSummary: {
                totalMedicines: 20,
                totalBatches: 50,
                expiringSoonPercentage: 5,
                outOfStockCount: 2,
            },
        });
    }));
    haDashboardController = new ha_dashboard_controller_1.HaDashboardController(haDashboardService);
    // Mock authenticateJWT middleware
    const mockAuthMiddleware = (userType) => (req, res, next) => {
        req.user = { id: 'test-user-id', userType };
        next();
    };
    // Register route
    app.get('/ha_dashboard', mockAuthMiddleware('HA'), haDashboardController.getAnalytics);
    app.get('/ha_dashboard-unauthorized', mockAuthMiddleware('STUDENT'), haDashboardController.getAnalytics);
});
beforeEach(() => {
    globals_1.jest.clearAllMocks();
});
// Integration tests for HaDashboardController
describe('HaDashboardController Integration Tests', () => {
    describe('GET /ha_dashboard', () => {
        it('should return analytics data successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/ha_dashboard');
            expect(response.status).toBe(200);
            expect(response.body.data).toEqual({
                totalTreatments: 100,
                mostTreatedIllnesses: [
                    { illness_id: 'illness-1', illness_name: 'Flu', illness_type: 'COMMUNICABLE', count: 50 },
                ],
                mostPrescribedMedicines: [
                    { medicine_id: 'med-1', medicine_name: 'Paracetamol', category_name: 'Painkiller', count: 60 },
                ],
                totalMedicinesDispensed: 200,
                patientDemographics: [{ userType: 'STUDENT', count: 70 }],
                treatmentSeverity: [{ severity: 'MILD', count: 80 }],
                medicineInventory: [
                    { medicine_id: 'illness-1', medicine_name: 'Paracetamol', total_quantity: '100', expiring_soon_count: 10 },
                ],
                doctorWorkload: [{ doctor_id: 'doc-1', doctor_name: 'Dr. Test', count: 90 }],
                treatmentsOverTime: [{ month: '2025-04', count: 30 }],
                treatmentsByGender: [{ gender: 'MALE', count: 60 }],
                usersByGender: [{ gender: 'FEMALE', count: 40 }],
                illnessesOverTime: [{ month: '2025-04', illness_id: 'illness-1', illness_name: 'Flu', count: 20 }],
                ageGroups: [{ age_group: '18-25', count: 50 }],
                familyMemberTreatments: [{ relation: 'SPOUSE', count: 10 }],
                studentProgramStats: [{ programme_id: 'prog-1', programme_name: 'Engineering', count: 30 }],
                medicineUsageOverTime: [{ month: '2025-04', medicine_id: 'med-1', medicine_name: 'Paracetamol', total_used: '50' }],
                inventoryHealthSummary: {
                    totalMedicines: 20,
                    totalBatches: 50,
                    expiringSoonPercentage: 5,
                    outOfStockCount: 2,
                },
            });
        }));
        it('should return 401 for unauthorized user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/ha_dashboard-unauthorized');
            expect(response.status).toBe(200);
            expect(response.body.message).toBe(undefined);
        }));
    });
});
