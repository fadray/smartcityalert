import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscalationService } from './escalation.service';
import { Incident } from '../incidents/incident.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incident])],
  providers: [EscalationService],
})
export class EscalationModule {}
