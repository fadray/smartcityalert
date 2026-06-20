import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';

import { Incident } from './incident.entity';
import { User } from '../users/user.entity';
import { Responder } from '../responders/responder.entity';

import { NotificationsModule } from '../notifications/notifications.module';
import { GeocodingModule } from '../geocoding/geocoding.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Incident,
      User,
      Responder,
    ]),

    NotificationsModule,

    GeocodingModule,
  ],

  providers: [
    IncidentsService,
  ],

  controllers: [
    IncidentsController,
  ],

  exports: [
    IncidentsService,
  ],
})
export class IncidentsModule {}