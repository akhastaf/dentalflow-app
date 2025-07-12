import { Controller } from '@nestjs/common';
import { TreatmentService } from './treatments.service';

@Controller('treatments')
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}
}
