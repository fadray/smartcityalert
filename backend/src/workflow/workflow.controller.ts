import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowConfigService } from './workflow-config.service';
import { AuthGuard } from '@nestjs/passport';
import { EscalationRule } from './workflow.interface';

@Controller('api/workflow')
@UseGuards(AuthGuard('jwt'))
export class WorkflowController {
  constructor(
    private workflowService: WorkflowService,
    private configService: WorkflowConfigService,
  ) {}

  @Get('config')
  async getConfig(@Query('departmentId') departmentId?: string) {
    return this.configService.getConfig(departmentId);
  }

  @Get('config/all')
  async getAllConfigs() {
    return this.configService.getAllConfigs();
  }

  @Get('config/:id')
  async getConfigById(@Param('id') id: string) {
    return this.configService.getConfigById(id);
  }

  @Put('config/:id')
  async updateConfig(@Param('id') id: string, @Body() updateData: any) {
    return this.configService.updateConfig(id, updateData);
  }

  @Post('config/reset')
  async resetConfig(@Query('departmentId') departmentId?: string) {
    return this.configService.createDefaultConfig(departmentId);
  }

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
}
