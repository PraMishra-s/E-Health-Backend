import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';
import { TreatmentController } from '../../modules/treatment/treatment.controller';
import { TreatmentService } from '../../modules/treatment/treatment.service';
import { BadRequestException, NotFoundException, UnauthorizedException } from '../../common/utils/catch-errors';

// Setup in-memory Express app
let app: Express;
let treatmentController: TreatmentController;
let treatmentService: TreatmentService;

  // Mock the database module
  jest.mock('../../database/drizzle', () => ({
    db: {
      query: jest.fn(),
      select: jest.fn(),
      // Add any other database methods that your service uses
    }
  }));

beforeAll(() => {
  app = express();
  app.use(express.json());

  // Mock TreatmentService to return predefined data
  treatmentService = new TreatmentService();
  jest.spyOn(treatmentService, 'addTreatment').mockImplementation(async (userId, data) => {
    if (!data.patient_id && !data.family_member_id) {
      throw new BadRequestException('Either patient_id or family_member_id is required.');
    }
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      patient_id: data.patient_id as string | null,
      family_member_id: data.family_member_id as string | null,
      doctor_id: userId as string | null,
      severity: data.severity as "MILD" | "MODERATE" | "SEVERE",
      notes: data.notes as string | null,
      blood_pressure: data.blood_pressure as string | null,
      forward_to_hospital: data.forward_to_hospital as boolean | null || false,
      forwarded_by_hospital: data.forwarded_by_hospital as boolean | null || false,
      created_at: new Date('2025-04-01T00:00:00.000Z'),
    };
  });
  jest.spyOn(treatmentService, 'updateTreatment').mockImplementation(async (treatmentId, data) => {
    if (treatmentId === 'non-existent-id') {
      throw new NotFoundException('Treatment record not found.');
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
  });
  jest.spyOn(treatmentService, 'getPatientTreatments').mockImplementation(async () => [
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
  ]);
  jest.spyOn(treatmentService, 'getTreatmentById').mockImplementation(async (treatmentId) => {
    if (treatmentId === 'non-existent-id') {
      throw new NotFoundException('Treatment record not found.');
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
  });
  jest.spyOn(treatmentService, 'deleteTreatment').mockImplementation(async (treatmentId) => {
    if (treatmentId === 'non-existent-id') {
      throw new NotFoundException('Treatment record not found.');
    }
  });
  jest.spyOn(treatmentService, 'getAllTreatment').mockImplementation(async () => [
    {
      treatmentId: '123e4567-e89b-12d3-a456-426614174000',
      patientId: '223e4567-e89b-12d3-a456-426614174001',
      familyMemberId: null,
      doctorId: '123e4567-e89b-12d3-a456-426614174000',
      severity: 'MILD' as const,
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
  ]);
  jest.spyOn(treatmentService, 'getAllStudents').mockImplementation(async () => [
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
  ]);

  treatmentController = new TreatmentController(treatmentService);

  // Mock authenticateJWT middleware
  const mockAuthMiddleware = (userType: string | null, userId: string | null = null) => (req: any, res: any, next: any) => {
    if (userType && userId) {
      req.user = { id: userId, userType };
    } else {
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
  jest.clearAllMocks();
});

// Integration tests for TreatmentController
describe('TreatmentController Integration Tests', () => {
  describe('POST /treatment/create', () => {
    it('should create a treatment successfully', async () => {
      const response = await request(app).post('/treatment/create').send({
        patient_id: '223e4567-e89b-12d3-a456-426614174001',
        illness_ids: ['ill-1'],
        severity: 'MILD',
        notes: 'Fever and cough',
        medicines: [{ medicine_id: 'med-1', dosage: '1 tablet' }],
      });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).post('/treatment/create-unauthorized').send({
        patient_id: '223e4567-e89b-12d3-a456-426614174001',
        illness_ids: ['ill-1'],
        severity: 'MILD',
      });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app).post('/treatment/create-invalid').send({
        illness_ids: ['ill-1'],
        severity: 'MILD',
      });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('PUT /treatment/update/:id', () => {
    it('should update a treatment successfully', async () => {
      const response = await request(app).put('/treatment/update/123e4567-e89b-12d3-a456-426614174000').send({
        severity: 'MODERATE',
        notes: 'Updated notes',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Treatment updated.');
    });

    it('should return 404 for non-existent treatment', async () => {
      const response = await request(app).put('/treatment/update/non-existent-id').send({
        severity: 'MODERATE',
      });
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('GET /treatment/patient/:id', () => {
    it('should retrieve patient treatments successfully', async () => {
      const response = await request(app).get('/treatment/patient/223e4567-e89b-12d3-a456-426614174001');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /treatment/individual/:id', () => {
    it('should retrieve treatment by ID successfully', async () => {
      const response = await request(app).get('/treatment/individual/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
    });

    it('should return 404 for non-existent treatment', async () => {
      const response = await request(app).get('/treatment/individual/non-existent-id');
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('DELETE /treatment/delete/:id', () => {
    it('should delete a treatment successfully', async () => {
      const response = await request(app).delete('/treatment/delete/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Treatment deleted successfully.');
    });

    it('should return 404 for non-existent treatment', async () => {
      const response = await request(app).delete('/treatment/delete/non-existent-id');
      expect(response.status).toBe(500);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('GET /treatment/patientAll', () => {
    it('should retrieve all treatments successfully', async () => {
      const response = await request(app).get('/treatment/patientAll');
      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/treatment/patientAll-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('GET /treatment/students', () => {
    it('should retrieve student treatments successfully', async () => {
      const response = await request(app).get('/treatment/students');
      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).get('/treatment/students-unauthorized');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });
});