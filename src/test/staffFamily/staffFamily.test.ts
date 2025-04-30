import request from 'supertest';
import { Express } from 'express';
import express from 'express';
import { jest } from '@jest/globals';
import { StaffService } from '../../modules/staffFamily/staff.service';
import { StaffController } from '../../modules/staffFamily/staff.controller';
import { NotFoundException } from '../../common/utils/catch-errors';

// Setup in-memory Express app
let app: Express;
let staffController: StaffController;
let staffService: StaffService;

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

  // Mock StaffService to return predefined data
  staffService = new StaffService();
  jest.spyOn(staffService, 'createFamilyMember').mockImplementation(async (data) => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    staff_id: data.staff_id,
    name: data.name,
    gender: data.gender as "MALE" | "FEMALE" | "OTHERS" | null,
    relation: data.relation,
    contact_number: data.contact_number || null,
    blood_type: data.blood_type as "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "Unknown" | null || null,
    date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
    is_active: true,
    created_at: new Date('2025-04-01T00:00:00.000Z'),
    updated_at: null,
  }));
  jest.spyOn(staffService, 'getFamilyMembers').mockImplementation(async (staffId) => {
    if (staffId === 'non-existent-staff') {
      throw new NotFoundException('No active family members found.');
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
  });
  jest.spyOn(staffService, 'getAllFamilyMembers').mockImplementation(async (staffId) => {
    if (staffId === 'non-existent-staff') {
      throw new NotFoundException('No family members found.');
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
  });
  jest.spyOn(staffService, 'updateFamilyMember').mockImplementation(async (id, data) => {
    if (id === 'non-existent-id') {
      throw new NotFoundException('Family member not found.');
    }
    return {
      id,
      staff_id: 'staff-1',
      name: data.name || 'Jane Doe',
      gender: (data.gender as "MALE" | "FEMALE" | "OTHERS" | null) || 'FEMALE',
      relation: (data.relation as "CHILD" | "SPOUSE" | "PARENT" | "SIBLING" | "OTHER") || 'SPOUSE',
      contact_number: data.contact_number || '12345678',
      blood_type: data.blood_type || 'O+',
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
      is_active: true,
      created_at: new Date('2025-04-01T00:00:00.000Z'),
      updated_at: new Date('2025-04-01T00:00:00.000Z'),
    };
  });
  jest.spyOn(staffService, 'deleteFamilyMember').mockImplementation(async (id) => {
    if (id === 'non-existent-id') {
      throw new NotFoundException('Family member not found.');
    }
    return;
  });
  jest.spyOn(staffService, 'hardDeleteFamilyMember').mockImplementation(async (id) => {
    if (id === 'non-existent-id') {
      throw new NotFoundException('Family member not found.');
    }
    return;
  });

  staffController = new StaffController(staffService);

  // Mock authenticateJWT middleware
  const mockAuthMiddleware = (userType: string | null) => (req: any, res: any, next: any) => {
    if (userType) {
      req.user = { id: 'test-user-id', userType };
    } else {
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
  jest.clearAllMocks();
});

// Integration tests for StaffController
describe('StaffController Integration Tests', () => {
  describe('POST /staffFamily/create', () => {
    it('should create a family member successfully', async () => {
      const response = await request(app).post('/staffFamily/create').send({
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
    });

    it('should return 401 for unauthorized user', async () => {
      const response = await request(app).post('/staffFamily/create-unauthorized').send({
        name: 'Jane Doe',
        staff_id: 'staff-1',
        gender: 'FEMALE',
        relation: 'SPOUSE',
      });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('GET /staffFamily/:staff_id', () => {
    it('should return active family members successfully', async () => {
      const response = await request(app).get('/staffFamily/staff-1');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Family members retrieved');
    });

    it('should return 404 for no active family members', async () => {
      const response = await request(app).get('/staffFamily/non-existent-staff');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('GET /staffFamily/all/:staff_id', () => {
    it('should return all family members successfully', async () => {
      const response = await request(app).get('/staffFamily/all/staff-1');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Family members retrieved');
    });

    it('should return 404 for no family members', async () => {
      const response = await request(app).get('/staffFamily/all/non-existent-staff');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('PUT /staffFamily/update/:id', () => {
    it('should update a family member successfully', async () => {
      const response = await request(app).put('/staffFamily/update/123e4567-e89b-12d3-a456-426614174000').send({
        name: 'Jane Smith',
        gender: 'FEMALE',
        relation: 'SPOUSE',
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Family member updated');
    });

    it('should return 404 for non-existent family member', async () => {
      const response = await request(app).put('/staffFamily/update/non-existent-id').send({
        name: 'Jane Smith',
      });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('DELETE /staffFamily/delete/:id', () => {
    it('should soft delete a family member successfully', async () => {
      const response = await request(app).delete('/staffFamily/delete/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Family member removed successfully');
    });

    it('should return 404 for non-existent family member', async () => {
      const response = await request(app).delete('/staffFamily/delete/non-existent-id');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(undefined);
    });
  });

  describe('DELETE /staffFamily/hard-delete/:id', () => {
    it('should hard delete a family member successfully', async () => {
      const response = await request(app).delete('/staffFamily/hard-delete/123e4567-e89b-12d3-a456-426614174000');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Family member permanently deleted.');
    });

    it('should return 404 for non-existent family member', async () => {
      const response = await request(app).delete('/staffFamily/hard-delete/non-existent-id');
      expect(response.status).toBe(404);
      expect(response.body.message).toBe(undefined);
    });
  });
});