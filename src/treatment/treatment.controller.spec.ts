import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentController } from './treatments.controller';
import { TreatmentService } from './treatments.service';

describe('TreatmentsController', () => {
  let controller: TreatmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreatmentController],
      providers: [TreatmentService],
    }).compile();

    controller = module.get<TreatmentController>(TreatmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
