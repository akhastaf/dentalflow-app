import { Module, Global } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';

@Global()
@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslAbilityModule {} 