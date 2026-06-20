import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { Incident } from '../incidents/incident.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { DepartmentsModule } from '../departments/departments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident, User]),
    UsersModule,
    IncidentsModule,
    DepartmentsModule,
  ],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
