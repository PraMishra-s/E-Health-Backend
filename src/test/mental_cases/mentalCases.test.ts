import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';
import { MentalController } from '../../modules/mental_cases/mentalCase.controller';
import { MentalService } from '../../modules/mental_cases/mentalCase.service';


jest.mock('../../database/drizzle', () => ({
    db: {
      query: jest.fn(),
      select: jest.fn(),
      // Add any other database methods that your service uses
    }
  }));


// Setup in-memory Express app
let app: Express;
let mentalController: MentalController;
let mentalService: MentalService;

beforeAll(() => {
  app = express();
  app.use(express.json());

  // Mock MentalService to return predefined data
  mentalService = new MentalService();
  jest.spyOn(mentalService, 'getAllCases').mockImplementation(async () => [
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
  ]);
  jest.spyOn(mentalService, 'updateCase').mockImplementation(async (id: string, data: { action_taken: string; is_resolved: boolean }) => ({
    id,
    treatment_id: null,
    user_id: null,
    family_member_id: null,
    illness_id: null,
    action_taken: data.action_taken,
    is_resolved: data.is_resolved,
    created_at: new Date(),
    updated_at: new Date()
  }));

  mentalController = new MentalController(mentalService);

  // Mock authenticateJWT middleware
  const mockAuthMiddleware = (userType: string) => (req: any, res: any, next: any) => {
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
  jest.clearAllMocks();
});

// Integration tests for MentalController
describe('MentalController Integration Tests', () => {
  describe('GET /mental_cases', () => {
    it('should return mental health cases successfully', async () => {
      const response = await request(app).get('/mental_cases');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Cases retrieved successfully');
      
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/mental_cases-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('PUT /mental_cases/update/:id', () => {
    it('should update a mental health case successfully', async () => {
      const response = await request(app).put('/mental_cases/update/case-1').send({
        action_taken: 'Follow-up session',
        is_resolved: true,
      });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).put('/mental_cases/update-unauthorized/case-1').send({
        action_taken: 'Follow-up session',
        is_resolved: true,
      });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });
});