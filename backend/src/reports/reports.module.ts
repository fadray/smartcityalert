import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Incident } from '../incidents/incident.entity';
import { User } from '../users/user.entity';
import { Department } from '../departments/department.entity';
import { Responder } from '../responders/responder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, User, Department, Responder])],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
