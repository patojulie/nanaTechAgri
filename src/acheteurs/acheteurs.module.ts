import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BuyersService } from './acheteurs.service';
import { BuyersController } from './acheteurs.controller';

@Module({
  imports: [DatabaseModule],
  providers: [BuyersService],
  controllers: [BuyersController],
  exports: [BuyersService],
})
export class BuyersModule {}
