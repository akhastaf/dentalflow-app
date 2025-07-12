import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, IsNull } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus, CreateAppointmentDto } from './dtos/create-appointment.dto';
import { FilterAppointmentsDto } from './dtos/filter-appointment.dto';
import { UpdateAppointmentDto } from './dtos/update-appointment.dto';
import { RescheduleAppointmentDto } from './dtos/reschedule-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}

  // ✅ CREATE
  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    // Slot conflict validation
    const conflict = await this.repo.findOne({
      where: {
        tenantId: dto.tenantId,
        doctorId: dto.doctorId,
        date: dto.date,
        startTime: dto.startTime,
        deletedAt: IsNull(),
      },
    });
    if (conflict) {
      throw new BadRequestException('This slot is already booked for the selected doctor.');
    }

    const appointment = this.repo.create({
      ...dto,
      status: dto.status || AppointmentStatus.PENDING,
      createdVia: dto.createdVia || 'staff',
    });

    return await this.repo.save(appointment);
  }

  // 🔎 FIND ONE BY ID
  async findById(id: string): Promise<Appointment> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Appointment not found');
    return found;
  }

  // 📋 FILTER LIST
  async findAll(filters: FilterAppointmentsDto): Promise<Appointment[]> {
    const where: FindOptionsWhere<Appointment> = {};

    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.doctorId) where.doctorId = filters.doctorId;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;

    if (filters.dateFrom && filters.dateTo) {
      where.date = Between(filters.dateFrom, filters.dateTo);
    }

    return await this.repo.find({ where, order: { date: 'ASC', startTime: 'ASC' } });
  }

  // 🛠️ UPDATE
  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findById(id);
    Object.assign(appointment, dto);
    return await this.repo.save(appointment);
  }

  // 🔁 RESCHEDULE
  async reschedule(id: string, dto: RescheduleAppointmentDto): Promise<Appointment> {
    const oldAppointment = await this.findById(id);

    // Slot conflict validation
    const conflict = await this.repo.findOne({
      where: {
        tenantId: oldAppointment.tenantId,
        doctorId: dto.doctorId ?? oldAppointment.doctorId,
        date: dto.newDate,
        startTime: dto.newStartTime,
        deletedAt: IsNull(),
      },
    });
    if (conflict) {
      throw new BadRequestException('This slot is already booked for the selected doctor.');
    }

    const newAppointment = this.repo.create({
      ...oldAppointment,
      id: undefined, // new ID
      date: dto.newDate,
      startTime: dto.newStartTime,
      endTime: dto.newEndTime,
      doctorId: dto.doctorId ?? oldAppointment.doctorId,
      rescheduledFromId: oldAppointment.id,
      status: AppointmentStatus.RESCHEDULED,
    });

    oldAppointment.status = AppointmentStatus.RESCHEDULED;
    await this.repo.save(oldAppointment);
    return await this.repo.save(newAppointment);
  }

  // ❌ SOFT DELETE
  async remove(id: string): Promise<void> {
    const appointment = await this.findById(id);
    await this.repo.softRemove(appointment);
  }

  // 🔄 UPDATE STATUS
  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const appointment = await this.findById(id);
    appointment.status = status;
    return await this.repo.save(appointment);
  }

  // ♻️ RESTORE SOFT DELETED
  async restore(id: string): Promise<Appointment> {
    await this.repo.restore(id);
    return this.findById(id);
  }

  // 🗑️ GET SOFT DELETED
  async getDeletedAppointments(): Promise<Appointment[]> {
    return this.repo.createQueryBuilder('appointment')
      .withDeleted()
      .where('appointment.deletedAt IS NOT NULL')
      .orderBy('appointment.deletedAt', 'DESC')
      .getMany();
  }
}
