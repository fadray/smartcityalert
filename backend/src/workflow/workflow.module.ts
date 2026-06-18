import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowService } from './workflow.service';
import { WorkflowConfigService } from './workflow-config.service';
import { WorkflowController } from './workflow.controller';
import { Incident } from '../incidents/incident.entity';
import { WorkflowConfig } from './workflow-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, WorkflowConfig])],
  providers: [WorkflowService, WorkflowConfigService],
  controllers: [WorkflowController],
  exports: [WorkflowService, WorkflowConfigService],
})
export class WorkflowModule {}
