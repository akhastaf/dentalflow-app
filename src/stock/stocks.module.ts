import { Module } from '@nestjs/common';
import { StockService } from './stocks.service';
import { StockController } from './stocks.controller';

@Module({
  controllers: [StockController],
  providers: [StockService],
})
export class StocksModule {}
