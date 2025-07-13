import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Not } from 'typeorm';
import { WaitingRoom, WaitingRoomStatus, EmergencyLevel } from './entities/waiting-room.entity';
import { CreateWaitingRoomDto } from './dtos/create-waiting-room.dto';
import { UpdateWaitingRoomDto } from './dtos/update-waiting-room.dto';
import { FilterWaitingRoomDto } from './dtos/filter-waiting-room.dto';
import { CallPatientDto } from './dtos/call-patient.dto';
import { CancelPatientDto } from './dtos/cancel-patient.dto';
import { PatientService } from '../patient/patient.service';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class WaitingRoomService {
  constructor(
    @InjectRepository(WaitingRoom)
    private readonly waitingRoomRepository: Repository<WaitingRoom>,
    private readonly patientService: PatientService,
    private readonly staffService: StaffService,
  ) {}

  /**
   * Create a new waiting room entry
   */
  async create(tenantId: string, createDto: CreateWaitingRoomDto, staffId: string): Promise<WaitingRoom> {
    // Verify patient exists
    const patient = await this.patientService.findById(createDto.patientId);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Verify patient belongs to the same tenant
    if (patient.tenantId !== tenantId) {
      throw new BadRequestException('Patient does not belong to this tenant');
    }

    // If assigned doctor is provided, verify they exist and are a doctor
    if (createDto.assignedDoctorId) {
      const doctor = await this.staffService.findById(createDto.assignedDoctorId);
      if (!doctor || doctor.role !== 'doctor') {
        throw new BadRequestException('Invalid doctor assignment');
      }
    }

    // Get the next order number for this tenant
    const nextOrder = await this.getNextOrder(tenantId);

    const waitingRoom = this.waitingRoomRepository.create({
      ...createDto,
      tenantId,
      order: createDto.order || nextOrder,
      status: WaitingRoomStatus.WAITING,
      emergencyLevel: createDto.emergencyLevel || EmergencyLevel.NORMAL,
    });

    return await this.waitingRoomRepository.save(waitingRoom);
  }

  /**
   * Get all waiting room entries for a tenant with filters
   */
  async findAll(tenantId: string, filterDto: FilterWaitingRoomDto): Promise<{
    data: WaitingRoom[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, search, status, emergencyLevel, assignedDoctorId, patientId } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.waitingRoomRepository
      .createQueryBuilder('waitingRoom')
      .leftJoinAndSelect('waitingRoom.patient', 'patient')
      .leftJoinAndSelect('waitingRoom.assignedDoctor', 'assignedDoctor')
      .leftJoinAndSelect('assignedDoctor.user', 'doctorUser')
      .where('waitingRoom.tenantId = :tenantId', { tenantId });

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(patient.fullName ILIKE :search OR patient.phone ILIKE :search OR waitingRoom.notes ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere('waitingRoom.status = :status', { status });
    }

    if (emergencyLevel) {
      queryBuilder.andWhere('waitingRoom.emergencyLevel = :emergencyLevel', { emergencyLevel });
    }

    if (assignedDoctorId) {
      queryBuilder.andWhere('waitingRoom.assignedDoctorId = :assignedDoctorId', { assignedDoctorId });
    }

    if (patientId) {
      queryBuilder.andWhere('waitingRoom.patientId = :patientId', { patientId });
    }

    // Order by emergency level (emergency first), then by order
    queryBuilder.orderBy('waitingRoom.emergencyLevel', 'DESC')
      .addOrderBy('waitingRoom.order', 'ASC');

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a specific waiting room entry
   */
  async findOne(id: string, tenantId: string): Promise<WaitingRoom> {
    const waitingRoom = await this.waitingRoomRepository.findOne({
      where: { id, tenantId },
      relations: ['patient', 'assignedDoctor', 'assignedDoctor.user'],
    });

    if (!waitingRoom) {
      throw new NotFoundException('Waiting room entry not found');
    }

    return waitingRoom;
  }

  /**
   * Update a waiting room entry
   */
  async update(id: string, tenantId: string, updateDto: UpdateWaitingRoomDto, staffId: string): Promise<WaitingRoom> {
    const waitingRoom = await this.findOne(id, tenantId);

    // If assigned doctor is being changed, verify they exist and are a doctor
    if (updateDto.assignedDoctorId && updateDto.assignedDoctorId !== waitingRoom.assignedDoctorId) {
      const doctor = await this.staffService.findById(updateDto.assignedDoctorId);
      if (!doctor || doctor.role !== 'doctor') {
        throw new BadRequestException('Invalid doctor assignment');
      }
    }

    // If order is being changed, check for conflicts
    if (updateDto.order && updateDto.order !== waitingRoom.order) {
      const existingOrder = await this.waitingRoomRepository.findOne({
        where: { tenantId, order: updateDto.order, id: Not(id) },
      });
      if (existingOrder) {
        throw new ConflictException('Order number already exists');
      }
    }

    Object.assign(waitingRoom, updateDto);
    return await this.waitingRoomRepository.save(waitingRoom);
  }

  /**
   * Call a patient (change status to CALLED)
   */
  async callPatient(id: string, tenantId: string, callDto: CallPatientDto, staffId: string): Promise<WaitingRoom> {
    const waitingRoom = await this.findOne(id, tenantId);

    if (waitingRoom.status !== WaitingRoomStatus.WAITING) {
      throw new BadRequestException('Patient is not in waiting status');
    }

    // If assigned doctor is provided, verify they exist and are a doctor
    if (callDto.assignedDoctorId) {
      const doctor = await this.staffService.findById(callDto.assignedDoctorId);
      if (!doctor || doctor.role !== 'doctor') {
        throw new BadRequestException('Invalid doctor assignment');
      }
    }

    waitingRoom.status = WaitingRoomStatus.CALLED;
    waitingRoom.calledBy = staffId;
    waitingRoom.calledAt = new Date();
    waitingRoom.assignedDoctorId = callDto.assignedDoctorId || waitingRoom.assignedDoctorId;
    if (callDto.notes) {
      waitingRoom.notes = callDto.notes;
    }

    return await this.waitingRoomRepository.save(waitingRoom);
  }

  /**
   * Start consultation (change status to IN_CONSULTATION)
   */
  async startConsultation(id: string, tenantId: string, staffId: string): Promise<WaitingRoom> {
    const waitingRoom = await this.findOne(id, tenantId);

    if (waitingRoom.status !== WaitingRoomStatus.CALLED) {
      throw new BadRequestException('Patient must be called before starting consultation');
    }

    waitingRoom.status = WaitingRoomStatus.IN_CONSULTATION;
    waitingRoom.consultationStartedAt = new Date();

    return await this.waitingRoomRepository.save(waitingRoom);
  }

  /**
   * Complete consultation (change status to COMPLETED)
   */
  async completeConsultation(id: string, tenantId: string, staffId: string): Promise<WaitingRoom> {
    const waitingRoom = await this.findOne(id, tenantId);

    if (waitingRoom.status !== WaitingRoomStatus.IN_CONSULTATION) {
      throw new BadRequestException('Patient must be in consultation to complete');
    }

    waitingRoom.status = WaitingRoomStatus.COMPLETED;
    waitingRoom.consultationEndedAt = new Date();

    return await this.waitingRoomRepository.save(waitingRoom);
  }

  /**
   * Cancel a patient from waiting room
   */
  async cancelPatient(id: string, tenantId: string, cancelDto: CancelPatientDto, staffId: string): Promise<WaitingRoom> {
    const waitingRoom = await this.findOne(id, tenantId);

    if (waitingRoom.status === WaitingRoomStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed consultation');
    }

    waitingRoom.status = WaitingRoomStatus.CANCELLED;
    waitingRoom.cancelledBy = staffId;
    waitingRoom.cancelledAt = new Date();
    waitingRoom.cancellationReason = cancelDto.reason;

    return await this.waitingRoomRepository.save(waitingRoom);
  }

  /**
   * Remove a patient from waiting room (soft delete)
   */
  async remove(id: string, tenantId: string, staffId: string): Promise<void> {
    const waitingRoom = await this.findOne(id, tenantId);
    await this.waitingRoomRepository.softDelete(id);
  }

  /**
   * Get the next order number for a tenant
   */
  private async getNextOrder(tenantId: string): Promise<number> {
    const lastEntry = await this.waitingRoomRepository.findOne({
      where: { tenantId },
      order: { order: 'DESC' },
    });

    return lastEntry ? lastEntry.order + 1 : 1;
  }

  /**
   * Reorder waiting room entries
   */
  async reorder(tenantId: string, reorderData: { id: string; newOrder: number }[]): Promise<WaitingRoom[]> {
    const updates = reorderData.map(async ({ id, newOrder }) => {
      const waitingRoom = await this.findOne(id, tenantId);
      waitingRoom.order = newOrder;
      return waitingRoom;
    });

    return await this.waitingRoomRepository.save(await Promise.all(updates));
  }

  /**
   * Get waiting room statistics for a tenant
   */
  async getStatistics(tenantId: string): Promise<{
    total: number;
    waiting: number;
    called: number;
    inConsultation: number;
    completed: number;
    cancelled: number;
    emergency: number;
    urgent: number;
  }> {
    const stats = await this.waitingRoomRepository
      .createQueryBuilder('waitingRoom')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN status = :waiting THEN 1 ELSE 0 END) as waiting',
        'SUM(CASE WHEN status = :called THEN 1 ELSE 0 END) as called',
        'SUM(CASE WHEN status = :inConsultation THEN 1 ELSE 0 END) as inConsultation',
        'SUM(CASE WHEN status = :completed THEN 1 ELSE 0 END) as completed',
        'SUM(CASE WHEN status = :cancelled THEN 1 ELSE 0 END) as cancelled',
        'SUM(CASE WHEN emergencyLevel = :emergency THEN 1 ELSE 0 END) as emergency',
        'SUM(CASE WHEN emergencyLevel = :urgent THEN 1 ELSE 0 END) as urgent',
      ])
      .where('waitingRoom.tenantId = :tenantId', { tenantId })
      .setParameters({
        waiting: WaitingRoomStatus.WAITING,
        called: WaitingRoomStatus.CALLED,
        inConsultation: WaitingRoomStatus.IN_CONSULTATION,
        completed: WaitingRoomStatus.COMPLETED,
        cancelled: WaitingRoomStatus.CANCELLED,
        emergency: EmergencyLevel.EMERGENCY,
        urgent: EmergencyLevel.URGENT,
      })
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      waiting: parseInt(stats.waiting) || 0,
      called: parseInt(stats.called) || 0,
      inConsultation: parseInt(stats.inConsultation) || 0,
      completed: parseInt(stats.completed) || 0,
      cancelled: parseInt(stats.cancelled) || 0,
      emergency: parseInt(stats.emergency) || 0,
      urgent: parseInt(stats.urgent) || 0,
    };
  }
} 