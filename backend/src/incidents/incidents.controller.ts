import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, Logger } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/incidents')
@UseGuards(AuthGuard('jwt'))
export class IncidentsController {
  private readonly logger = new Logger(IncidentsController.name);

  constructor(private incidentsService: IncidentsService) {}

  @Get()
  findAll() {
    return this.incidentsService.findAll();
  }

  @Get('active')
  findActive() {
    return this.incidentsService.findActive();
  }

  @Get('stats')
  getStats() {
    return this.incidentsService.getStats();
  }

  @Get('pending-approvals')
  getPendingApprovals(@Request() req) {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    return this.incidentsService.getPendingApprovals(userRole, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Post()
  create(@Body() createIncidentDto: any, @Request() req) {
    const userId = req.user?.id || req.user?.sub;
    const images = createIncidentDto.images || [];
    return this.incidentsService.create(createIncidentDto, userId, images);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req) {
    return this.incidentsService.updateStatus(id, status, req.user?.id, req.user?.full_name, req.user?.role);
  }

  @Post(':id/assign')
  async assignToUser(@Param('id') id: string, @Body() body: any, @Request() req) {
    this.logger.log(`Assigning incident ${id} to ${body.assigneeType} ${body.assigneeId}`);
    return this.incidentsService.assignToUser(
      id, 
      body.assigneeId, 
      body.assigneeType, 
      body.comments, 
      req.user?.id,
      req.user?.full_name
    );
  }

  @Put(':id/workflow')
  updateWorkflow(@Param('id') id: string, @Body('level') level: number, @Request() req) {
    return this.incidentsService.updateWorkflowLevel(id, level, req.user?.id, req.user?.full_name);
  }

  @Post(':id/resolution-proof')
  uploadResolutionProof(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req
  ) {
    return this.incidentsService.uploadResolutionProof(
      id,
      req.user?.id,
      req.user?.full_name,
      body.proof_image,
      body.proof_description,
      req.user?.role
    );
  }

  @Post(':id/approve')
  approveResolution(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @Request() req
  ) {
    const level = this.getLevelForRole(req.user?.role);
    return this.incidentsService.approveResolution(
      id,
      req.user?.id,
      req.user?.full_name,
      req.user?.role,
      comments,
      level
    );
  }

  @Post(':id/reject')
  rejectResolution(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @Request() req
  ) {
    return this.incidentsService.rejectResolution(id, req.user?.id, req.user?.full_name, comments);
  }

  private getLevelForRole(role: string): number {
    const levelMap: any = {
      'responder': 1,
      'supervisor': 2,
      'hod': 3,
      'dept_director': 4,
      'overall_manager': 5,
      'overall_director': 6,
      'admin': 6,
    };
    return levelMap[role] || 1;
  }
}
