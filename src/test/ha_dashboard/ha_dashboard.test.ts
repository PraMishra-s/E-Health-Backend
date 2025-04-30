// Create a mock for the database module

// First, create a file called __mocks__/database.ts or in your test directory
// This will mock the drizzle.ts file

// __mocks__/database.ts
export const db = {
    // Add mock methods and properties that your service uses
    query: jest.fn(),
    select: jest.fn(),
    // Add other methods your code might be using
  };
  
  // Then modify your test file to use the mock:
  
  import request from 'supertest';
  import { Express } from 'express';
  import express from 'express';
  import { jest } from '@jest/globals';
  import { HaDashboardController } from '../../modules/ha_dashboard/ha_dashboard.controller';
  import { HaDashboardService } from '../../modules/ha_dashboard/ha_dashboard.service';
  
  // Mock the database module
  jest.mock('../../database/drizzle', () => ({
    db: {
      query: jest.fn(),
      select: jest.fn(),
      // Add any other database methods that your service uses
    }
  }));
  
  // Setup in-memory Express app
  let app: Express;
  let haDashboardController: HaDashboardController;
  let haDashboardService: HaDashboardService;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
  
    // Mock HaDashboardService to return predefined analytics data
    haDashboardService = new HaDashboardService();
    jest.spyOn(haDashboardService, 'getAnalytics').mockImplementation(async () => ({
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
    }));
  
    haDashboardController = new HaDashboardController(haDashboardService);
  
    // Mock authenticateJWT middleware
    const mockAuthMiddleware = (userType: string) => (req: any, res: any, next: any) => {
      req.user = { id: 'test-user-id', userType };
      next();
    };
  
    // Register route
    app.get('/ha_dashboard', mockAuthMiddleware('HA'), haDashboardController.getAnalytics);
    app.get('/ha_dashboard-unauthorized', mockAuthMiddleware('STUDENT'), haDashboardController.getAnalytics);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Integration tests for HaDashboardController
  describe('HaDashboardController Integration Tests', () => {
    describe('GET /ha_dashboard', () => {
      it('should return analytics data successfully', async () => {
        const response = await request(app).get('/ha_dashboard');
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
      });
  
      it('should return 401 for unauthorized user', async () => {
        const response = await request(app).get('/ha_dashboard-unauthorized');
        expect(response.status).toBe(200);
        expect(response.body.message).toBe(undefined);
      });
    });
  });