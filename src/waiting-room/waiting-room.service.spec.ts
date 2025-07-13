import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitingRoomService } from './waiting-room.service';
import { WaitingRoom, WaitingRoomStatus, EmergencyLevel } from './entities/waiting-room.entity';
import { PatientService } from '../patient/patient.service';
import { StaffService } from '../staff/staff.service';
import { CreateWaitingRoomDto } from './dtos/create-waiting-room.dto';
import { UpdateWaitingRoomDto } from './dtos/update-waiting-room.dto';
import { CallPatientDto } from './dtos/call-patient.dto';
import { CancelPatientDto } from './dtos/cancel-patient.dto';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

describe('WaitingRoomService', () => {
  let service: WaitingRoomService;
  let waitingRoomRepository: Repository<WaitingRoom>;
  let patientService: PatientService;
  let staffService: StaffService;

  const mockWaitingRoomRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      select: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    })),
    softDelete: jest.fn(),
  };

  const mockPatientService = {
    findById: jest.fn(),
  };

  const mockStaffService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitingRoomService,
        {
          provide: getRepositoryToken(WaitingRoom),
          useValue: mockWaitingRoomRepository,
        },
        {
          provide: PatientService,
          useValue: mockPatientService,
        },
        {
          provide: StaffService,
          useValue: mockStaffService,
        },
      ],
    }).compile();

    service = module.get<WaitingRoomService>(WaitingRoomService);
    waitingRoomRepository = module.get<Repository<WaitingRoom>>(getRepositoryToken(WaitingRoom));
    patientService = module.get<PatientService>(PatientService);
    staffService = module.get<StaffService>(StaffService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const tenantId = 'tenant-1';
    const staffId = 'staff-1';
    const createDto: CreateWaitingRoomDto = {
      patientId: 'patient-1',
      emergencyLevel: EmergencyLevel.URGENT,
      notes: 'Test patient',
    };

    it('should create a new waiting room entry', async () => {
      const mockPatient = { id: 'patient-1', tenantId: 'tenant-1' };
      const mockWaitingRoom = { id: 'waiting-1', ...createDto, tenantId };

      mockPatientService.findById.mockResolvedValue(mockPatient);
      mockWaitingRoomRepository.create.mockReturnValue(mockWaitingRoom);
      mockWaitingRoomRepository.save.mockResolvedValue(mockWaitingRoom);

      const result = await service.create(tenantId, createDto, staffId);

      expect(result).toEqual(mockWaitingRoom);
      expect(mockPatientService.findById).toHaveBeenCalledWith(createDto.patientId);
      expect(mockWaitingRoomRepository.create).toHaveBeenCalled();
      expect(mockWaitingRoomRepository.save).toHaveBeenCalledWith(mockWaitingRoom);
    });

    it('should throw NotFoundException if patient not found', async () => {
      mockPatientService.findById.mockResolvedValue(null);

      await expect(service.create(tenantId, createDto, staffId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if patient belongs to different tenant', async () => {
      const mockPatient = { id: 'patient-1', tenantId: 'different-tenant' };
      mockPatientService.findById.mockResolvedValue(mockPatient);

      await expect(service.create(tenantId, createDto, staffId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    const tenantId = 'tenant-1';
    const filterDto = { page: 1, limit: 10 };

    it('should return paginated waiting room entries', async () => {
      const mockData = [{ id: 'waiting-1' }, { id: 'waiting-2' }];
      const mockTotal = 2;

      mockWaitingRoomRepository.createQueryBuilder().getManyAndCount.mockResolvedValue([mockData, mockTotal]);

      const result = await service.findAll(tenantId, filterDto);

      expect(result).toEqual({
        data: mockData,
        total: mockTotal,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findOne', () => {
    const id = 'waiting-1';
    const tenantId = 'tenant-1';

    it('should return a waiting room entry', async () => {
      const mockWaitingRoom = { id, tenantId, patient: {}, assignedDoctor: {} };

      mockWaitingRoomRepository.findOne.mockResolvedValue(mockWaitingRoom);

      const result = await service.findOne(id, tenantId);

      expect(result).toEqual(mockWaitingRoom);
    });

    it('should throw NotFoundException if entry not found', async () => {
      mockWaitingRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(id, tenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('callPatient', () => {
    const id = 'waiting-1';
    const tenantId = 'tenant-1';
    const staffId = 'staff-1';
    const callDto: CallPatientDto = { assignedDoctorId: 'doctor-1' };

    it('should call a patient successfully', async () => {
      const mockWaitingRoom = {
        id,
        tenantId,
        status: WaitingRoomStatus.WAITING,
        assignedDoctorId: null,
      };

      mockWaitingRoomRepository.findOne.mockResolvedValue(mockWaitingRoom);
      mockStaffService.findById.mockResolvedValue({ id: 'doctor-1', role: 'doctor' });
      mockWaitingRoomRepository.save.mockResolvedValue({
        ...mockWaitingRoom,
        status: WaitingRoomStatus.CALLED,
        calledBy: staffId,
        calledAt: expect.any(Date),
        assignedDoctorId: 'doctor-1',
      });

      const result = await service.callPatient(id, tenantId, callDto, staffId);

      expect(result.status).toBe(WaitingRoomStatus.CALLED);
      expect(result.calledBy).toBe(staffId);
      expect(result.calledAt).toBeDefined();
    });

    it('should throw BadRequestException if patient is not in waiting status', async () => {
      const mockWaitingRoom = {
        id,
        tenantId,
        status: WaitingRoomStatus.CALLED,
      };

      mockWaitingRoomRepository.findOne.mockResolvedValue(mockWaitingRoom);

      await expect(service.callPatient(id, tenantId, callDto, staffId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('startConsultation', () => {
    const id = 'waiting-1';
    const tenantId = 'tenant-1';
    const staffId = 'staff-1';

    it('should start consultation successfully', async () => {
      const mockWaitingRoom = {
        id,
        tenantId,
        status: WaitingRoomStatus.CALLED,
      };

      mockWaitingRoomRepository.findOne.mockResolvedValue(mockWaitingRoom);
      mockWaitingRoomRepository.save.mockResolvedValue({
        ...mockWaitingRoom,
        status: WaitingRoomStatus.IN_CONSULTATION,
        consultationStartedAt: expect.any(Date),
      });

      const result = await service.startConsultation(id, tenantId, staffId);

      expect(result.status).toBe(WaitingRoomStatus.IN_CONSULTATION);
      expect(result.consultationStartedAt).toBeDefined();
    });

    it('should throw BadRequestException if patient is not called', async () => {
      const mockWaitingRoom = {
        id,
        tenantId,
        status: WaitingRoomStatus.WAITING,
      };

      mockWaitingRoomRepository.findOne.mockResolvedValue(mockWaitingRoom);

      await expect(service.startConsultation(id, tenantId, staffId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeConsultation', () => {
    const id = 'waiting-1';
    const tenantId = 'tenant-1';
    const staffId = 'staff-1';

    it('should complete consultation successfully', async () => {
      const mockWaitingRoom = {
        id,
        tenantId,
        status: WaitingRoomStatus.IN_CONSULTATION,
      };

      mockWaitingRoomRepository.findOne.mockResolvedValue(mockWaitingRoom);
      mockWaitingRoomRepository.save.mockResolvedValue({
        ...mockWaitingRoom,
        status: WaitingRoomStatus.COMPLETED,
        consultationEndedAt: expect.any(Date),
      });

      const result = await service.completeConsultation(id, tenantId, staffId);

      expect(result.status).toBe(WaitingRoomStatus.COMPLETED);
      expect(result.consultationEndedAt).toBeDefined();
    });

    it('should throw BadRequestException if patient is not in consultation', async () => {
      const mockWaitingRoom = {
        id,
        tenantId,
        status: WaitingRoomStatus.CALLED,
      };

      mockWaitingRoomRepository.findOne.mockResolvedValue(mockWaitingRoom);

      await expect(service.completeConsultation(id, tenantId, staffId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelPatient', () => {
    const id = 'waiting-1';
    const tenantId = 'tenant-1';
    const staffId = 'staff-1';
    const cancelDto: CancelPatientDto = { reason: 'Patient requested cancellation' };

    it('should cancel patient successfully', async () => {
      const mockWaitingRoom = {
        id,
        tenantId,
        status: WaitingRoomStatus.WAITING,
      };

      mockWaitingRoomRepository.findOne.mockResolvedValue(mockWaitingRoom);
      mockWaitingRoomRepository.save.mockResolvedValue({
        ...mockWaitingRoom,
        status: WaitingRoomStatus.CANCELLED,
        cancelledBy: staffId,
        cancelledAt: expect.any(Date),
        cancellationReason: cancelDto.reason,
      });

      const result = await service.cancelPatient(id, tenantId, cancelDto, staffId);

      expect(result.status).toBe(WaitingRoomStatus.CANCELLED);
      expect(result.cancelledBy).toBe(staffId);
      expect(result.cancellationReason).toBe(cancelDto.reason);
    });

    it('should throw BadRequestException if consultation is completed', async () => {
      const mockWaitingRoom = {
        id,
        tenantId,
        status: WaitingRoomStatus.COMPLETED,
      };

      mockWaitingRoomRepository.findOne.mockResolvedValue(mockWaitingRoom);

      await expect(service.cancelPatient(id, tenantId, cancelDto, staffId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatistics', () => {
    const tenantId = 'tenant-1';

    it('should return waiting room statistics', async () => {
      const mockStats = {
        total: '10',
        waiting: '5',
        called: '2',
        inConsultation: '1',
        completed: '1',
        cancelled: '1',
        emergency: '1',
        urgent: '2',
      };

      mockWaitingRoomRepository.createQueryBuilder().getRawOne.mockResolvedValue(mockStats);

      const result = await service.getStatistics(tenantId);

      expect(result).toEqual({
        total: 10,
        waiting: 5,
        called: 2,
        inConsultation: 1,
        completed: 1,
        cancelled: 1,
        emergency: 1,
        urgent: 2,
      });
    });
  });
}); 