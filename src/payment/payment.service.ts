import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentTreatment } from './entities/payment-treatment.entity';
import { CreatePaymentDto, PaymentStatus, PaymentTreatmentDto } from './dtos/create-payment.dto';
import { FilterPaymentDto } from './dtos/filter-payment.dto';
import { UpdatePaymentDto } from './dtos/update-payment.dto';
import { Treatment, TreatmentStatus } from '../treatment/entities/tratment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentTreatment)
    private readonly paymentTreatmentRepo: Repository<PaymentTreatment>,
    @InjectRepository(Treatment)
    private readonly treatmentRepo: Repository<Treatment>,
  ) {}

  // ✅ CREATE
  async create(dto: CreatePaymentDto): Promise<Payment> {
    // Generate reference if not provided
    if (!dto.reference) {
      dto.reference = this.generateReference();
    }

    // Validate that the total amount matches the sum of treatment payments
    const totalTreatmentAmount = dto.paymentTreatments.reduce((sum, pt) => sum + pt.amountPaid, 0);
    if (Math.abs(totalTreatmentAmount - dto.amount) > 0.01) {
      throw new BadRequestException('Payment amount must match the sum of treatment payments');
    }

    // Use transaction to ensure all updates are committed together
    return await this.paymentRepo.manager.transaction(async (entityManager) => {
      const payment = entityManager.create(Payment, {
        patientId: dto.patientId,
        tenantId: dto.tenantId,
        amount: dto.amount,
        isPartial: dto.isPartial || false,
        status: dto.status || PaymentStatus.COMPLETED,
        paymentMethod: dto.paymentMethod,
        reference: dto.reference,
        note: dto.note,
      });

      const savedPayment = await entityManager.save(payment);

      // Create payment treatment records and update treatment amounts within transaction
      await this.createPaymentTreatmentsInTransaction(entityManager, savedPayment.id, dto.paymentTreatments);

      // Fetch the complete payment with relations within the transaction
      const completePayment = await entityManager.findOne(Payment, {
        where: { id: savedPayment.id },
        relations: ['patient', 'tenant', 'paymentTreatments', 'paymentTreatments.treatment']
      });

      if (!completePayment) {
        throw new NotFoundException('Payment not found after creation');
      }

      return completePayment;
    });
  }

  // 💰 CREATE PAYMENT TREATMENTS
  private async createPaymentTreatments(
    paymentId: string, 
    paymentTreatments: PaymentTreatmentDto[]
  ): Promise<void> {
    const paymentTreatmentEntities: PaymentTreatment[] = [];

    for (const ptDto of paymentTreatments) {
      // Verify treatment exists and belongs to the same patient
      const treatment = await this.treatmentRepo.findOne({
        where: { id: ptDto.treatmentId }
      });

      if (!treatment) {
        throw new NotFoundException(`Treatment with ID ${ptDto.treatmentId} not found`);
      }

      // Check if payment amount is valid (not exceeding remaining amount)
      const remainingAmount = treatment.amount - treatment.amountPaid;
      if (ptDto.amountPaid > remainingAmount) {
        throw new BadRequestException(
          `Payment amount ${ptDto.amountPaid} exceeds remaining amount ${remainingAmount} for treatment ${ptDto.treatmentId}`
        );
      }

      // Create payment treatment record
      paymentTreatmentEntities.push(
        this.paymentTreatmentRepo.create({
          paymentId,
          treatmentId: ptDto.treatmentId,
          amountPaid: ptDto.amountPaid,
        })
      );

      // Update treatment's paid amount
      const oldAmountPaid = Number(treatment.amountPaid) || 0;
      const newAmountPaid = oldAmountPaid + Number(ptDto.amountPaid);
      treatment.amountPaid = newAmountPaid;
      
      // Update treatment status based on payment progress
      if (treatment.amountPaid >= treatment.amount) {
        treatment.status = TreatmentStatus.COMPLETED;
      } else if (treatment.amountPaid > 0) {
        treatment.status = TreatmentStatus.IN_PROGRESS;
      }

      // Save the updated treatment
      const savedTreatment = await this.treatmentRepo.save(treatment);
      
      // Log for debugging
      console.log(`Treatment ${treatment.id} updated: amountPaid ${oldAmountPaid} -> ${savedTreatment.amountPaid}, status: ${savedTreatment.status}`);
    }

    // Save all payment treatment records
    if (paymentTreatmentEntities.length > 0) {
      await this.paymentTreatmentRepo.save(paymentTreatmentEntities);
    }
  }

  // 💰 CREATE PAYMENT TREATMENTS (Transaction version)
  private async createPaymentTreatmentsInTransaction(
    entityManager: any,
    paymentId: string, 
    paymentTreatments: PaymentTreatmentDto[]
  ): Promise<void> {
    const paymentTreatmentEntities: PaymentTreatment[] = [];

    for (const ptDto of paymentTreatments) {
      // Verify treatment exists and belongs to the same patient
      const treatment = await entityManager.findOne(Treatment, {
        where: { id: ptDto.treatmentId }
      });

      if (!treatment) {
        throw new NotFoundException(`Treatment with ID ${ptDto.treatmentId} not found`);
      }

      // Check if payment amount is valid (not exceeding remaining amount)
      const remainingAmount = treatment.amount - treatment.amountPaid;
      if (ptDto.amountPaid > remainingAmount) {
        throw new BadRequestException(
          `Payment amount ${ptDto.amountPaid} exceeds remaining amount ${remainingAmount} for treatment ${ptDto.treatmentId}`
        );
      }

      // Create payment treatment record
      paymentTreatmentEntities.push(
        entityManager.create(PaymentTreatment, {
          paymentId,
          treatmentId: ptDto.treatmentId,
          amountPaid: ptDto.amountPaid,
        })
      );

      // Update treatment's paid amount
      const oldAmountPaid = Number(treatment.amountPaid) || 0;
      const newAmountPaid = oldAmountPaid + Number(ptDto.amountPaid);
      treatment.amountPaid = newAmountPaid;
      
      // Update treatment status based on payment progress
      if (treatment.amountPaid >= treatment.amount) {
        treatment.status = TreatmentStatus.COMPLETED;
      } else if (treatment.amountPaid > 0) {
        treatment.status = TreatmentStatus.IN_PROGRESS;
      }

      // Save the updated treatment within transaction
      const savedTreatment = await entityManager.save(treatment);
      
      // Log for debugging
      console.log(`Treatment ${treatment.id} updated in transaction: amountPaid ${oldAmountPaid} -> ${savedTreatment.amountPaid}, status: ${savedTreatment.status}`);
    }

    // Save all payment treatment records within transaction
    if (paymentTreatmentEntities.length > 0) {
      await entityManager.save(paymentTreatmentEntities);
    }
  }

  // 🔄 REVERT PAYMENT TREATMENTS (for updates/deletes)
  private async revertPaymentTreatments(paymentId: string): Promise<void> {
    const paymentTreatments = await this.paymentTreatmentRepo.find({
      where: { paymentId }
    });

    for (const pt of paymentTreatments) {
      const treatment = await this.treatmentRepo.findOne({
        where: { id: pt.treatmentId }
      });

      if (treatment) {
        // Revert the paid amount
        const oldAmountPaid = Number(treatment.amountPaid) || 0;
        const newAmountPaid = oldAmountPaid - Number(pt.amountPaid);
        treatment.amountPaid = newAmountPaid;
        
        // Ensure amountPaid doesn't go below 0
        treatment.amountPaid = Math.max(0, treatment.amountPaid);
        
        // Update treatment status based on remaining amount
        if (treatment.amountPaid >= treatment.amount) {
          treatment.status = TreatmentStatus.COMPLETED;
        } else if (treatment.amountPaid > 0) {
          treatment.status = TreatmentStatus.IN_PROGRESS;
        } else {
          treatment.status = TreatmentStatus.PLANNED;
        }

        // Save the updated treatment
        const savedTreatment = await this.treatmentRepo.save(treatment);
        
        // Log for debugging
        console.log(`Treatment ${treatment.id} reverted: amountPaid ${oldAmountPaid} -> ${savedTreatment.amountPaid}, status: ${savedTreatment.status}`);
      }
    }
  }

  // 🔎 FIND ONE BY ID
  async findById(id: string, includeDeleted: boolean = false): Promise<Payment> {
    const found = await this.paymentRepo.findOne({ 
      where: { id },
      relations: ['patient', 'tenant', 'paymentTreatments', 'paymentTreatments.treatment'],
      withDeleted: includeDeleted
    });
    if (!found) throw new NotFoundException('Payment not found');
    return found;
  }

  // 📋 FILTER LIST
  async findAll(filters: FilterPaymentDto): Promise<Payment[]> {
    const where: FindOptionsWhere<Payment> = {};

    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status;
    if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
    if (filters.isPartial !== undefined) where.isPartial = filters.isPartial;

    // Handle amount range
    if (filters.minAmount || filters.maxAmount) {
      if (filters.minAmount && filters.maxAmount) {
        where.amount = Between(filters.minAmount, filters.maxAmount);
      } else if (filters.minAmount) {
        where.amount = MoreThanOrEqual(filters.minAmount);
      } else if (filters.maxAmount) {
        where.amount = LessThanOrEqual(filters.maxAmount);
      }
    }

    // Handle date range
    if (filters.dateFrom && filters.dateTo) {
      where.createdAt = Between(new Date(filters.dateFrom), new Date(filters.dateTo));
    }

    const query = this.paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.patient', 'patient')
      .leftJoinAndSelect('payment.tenant', 'tenant')
      .leftJoinAndSelect('payment.paymentTreatments', 'paymentTreatments')
      .leftJoinAndSelect('paymentTreatments.treatment', 'treatment')
      .where(where);

    // Handle soft delete filtering
    if (filters.includeDeleted) {
      query.withDeleted();
    }

    // Handle reference search
    if (filters.reference) {
      query.andWhere('payment.reference ILIKE :reference', { 
        reference: `%${filters.reference}%` 
      });
    }

    // Handle treatment filtering
    if (filters.treatmentId) {
      query.andWhere('paymentTreatments.treatmentId = :treatmentId', { 
        treatmentId: filters.treatmentId 
      });
    }

    return await query
      .orderBy('payment.createdAt', 'DESC')
      .getMany();
  }

  // 🛠️ UPDATE
  async update(id: string, dto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findById(id);
    
    // Handle payment treatments update if provided
    if (dto.paymentTreatments) {
      // Revert existing payment treatments and update treatment amounts
      await this.revertPaymentTreatments(id);
      
      // Remove existing payment treatments
      await this.paymentTreatmentRepo.delete({ paymentId: id });
      
      // Create new payment treatments
      await this.createPaymentTreatments(id, dto.paymentTreatments);
    }

    // Update payment fields
    Object.assign(payment, dto);

    return await this.paymentRepo.save(payment);
  }

  // 💰 GET PAYMENT STATISTICS
  async getPaymentStats(tenantId: string, dateFrom?: string, dateTo?: string) {
    const query = this.paymentRepo.createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.status = :status', { status: PaymentStatus.COMPLETED });

    if (dateFrom && dateTo) {
      query.andWhere('payment.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo)
      });
    }

    const payments = await query.getMany();
    
    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const paymentCount = payments.length;
    
    // Group by payment method
    const byMethod = payments.reduce((acc, payment) => {
      const method = payment.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + Number(payment.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAmount,
      paymentCount,
      byMethod,
      averageAmount: paymentCount > 0 ? totalAmount / paymentCount : 0
    };
  }

  // 🔄 UPDATE STATUS
  async updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
    const payment = await this.findById(id);
    payment.status = status;
    return await this.paymentRepo.save(payment);
  }

  // 🗑️ SOFT DELETE
  async remove(id: string): Promise<void> {
    const payment = await this.findById(id);
    
    // Revert payment treatments and update treatment amounts
    await this.revertPaymentTreatments(id);
    
    // Remove payment treatment records
    await this.paymentTreatmentRepo.delete({ paymentId: id });
    
    await this.paymentRepo.softRemove(payment);
  }

  // 🗑️ PERMANENT DELETE (use with caution)
  async permanentRemove(id: string): Promise<void> {
    const payment = await this.findById(id);
    
    // Revert payment treatments and update treatment amounts
    await this.revertPaymentTreatments(id);
    
    // Remove payment treatment records
    await this.paymentTreatmentRepo.delete({ paymentId: id });
    
    await this.paymentRepo.remove(payment);
  }

  // 🔄 RESTORE SOFT DELETED PAYMENT
  async restore(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      withDeleted: true
    });
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    
    if (!payment.deletedAt) {
      throw new BadRequestException('Payment is not deleted');
    }
    
    await this.paymentRepo.restore(id);
    return await this.findById(id);
  }

  // 📋 GET AVAILABLE TREATMENTS FOR PAYMENT
  async getAvailableTreatmentsForPayment(patientId: string, tenantId: string): Promise<Treatment[]> {
    return await this.treatmentRepo.find({
      where: {
        patientId,
        tenantId,
        status: In([TreatmentStatus.PLANNED, TreatmentStatus.IN_PROGRESS, TreatmentStatus.COMPLETED]),
      },
      relations: ['tenantTreatment'],
      order: { createdAt: 'ASC' }
    }).then(treatments => 
      // Filter treatments that have remaining amounts to be paid
      treatments.filter(treatment => {
        const remainingAmount = Number(treatment.amount) - Number(treatment.amountPaid);
        return remainingAmount > 0;
      })
    );
  }

  // 🗑️ GET DELETED PAYMENTS
  async getDeletedPayments(tenantId?: string): Promise<Payment[]> {
    const query = this.paymentRepo.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.patient', 'patient')
      .leftJoinAndSelect('payment.tenant', 'tenant')
      .leftJoinAndSelect('payment.paymentTreatments', 'paymentTreatments')
      .leftJoinAndSelect('paymentTreatments.treatment', 'treatment')
      .withDeleted()
      .where('payment.deletedAt IS NOT NULL');

    if (tenantId) {
      query.andWhere('payment.tenantId = :tenantId', { tenantId });
    }

    return await query
      .orderBy('payment.deletedAt', 'DESC')
      .getMany();
  }

  // 🔧 GENERATE REFERENCE
  private generateReference(): string {
    return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}
