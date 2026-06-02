import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { AuthGuard } from '@nestjs/passport';
import { EscalationRule } from './workflow.interface';

@Controller('api/workflow')
@UseGuards(AuthGuard('jwt'))
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Get('rules')
  async getRules(): Promise<EscalationRule[]> {
    return this.workflowService.getEscalationRules();
  }

  @Post('rules')
  async createRule(@Body() rule: any): Promise<EscalationRule> {
    return this.workflowService.createEscalationRule(rule);
  }

  @Put('rules/:id')
  async updateRule(@Param('id') id: string, @Body() rule: any): Promise<EscalationRule> {
    return this.workflowService.updateEscalationRule(id, rule);
  }

  @Get('config')
  async getConfig(): Promise<any> {
    return this.workflowService.getWorkflowConfig();
  }

  @Put('config')
  async updateConfig(@Body() config: any): Promise<any> {
    return this.workflowService.updateWorkflowConfig(config);
  }
}
