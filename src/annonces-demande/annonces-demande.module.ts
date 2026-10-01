import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnnonceDemande, ReponseAnnonceDemande } from '../database/entities';
import { AnnoncesDemandeService } from './annonces-demande.service';
import { AnnoncesDemandeController } from './annonces-demande.controller';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([AnnonceDemande, ReponseAnnonceDemande]), DatabaseModule, NotificationsModule],
  providers: [AnnoncesDemandeService],
  controllers: [AnnoncesDemandeController],
  exports: [AnnoncesDemandeService],
})
export class AnnoncesDemandeModule {}
