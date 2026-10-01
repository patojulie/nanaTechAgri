import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LanguesModule } from '../langues/langues.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [DatabaseModule, LanguesModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
