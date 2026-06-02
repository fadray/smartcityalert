import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/maintenance')
@UseGuards(AuthGuard('jwt'))
export class MaintenanceController {
  constructor(private maintenanceService: MaintenanceService) {}

  // Maintenance Requests
  @Get('requests')
  getAllRequests(@Query() query) {
    return this.maintenanceService.getAllRequests(query);
  }

  @Get('requests/stats')
  getStats() {
    return this.maintenanceService.getStats();
  }

  @Get('requests/:id')
  getRequestById(@Param('id') id: string) {
    return this.maintenanceService.getRequestById(id);
  }

  @Post('requests')
  createRequest(@Body() data: any, @Request() req) {
    return this.maintenanceService.createRequest(data, req.user.id);
  }

  @Put('requests/:id')
  updateRequest(@Param('id') id: string, @Body() data: any) {
    return this.maintenanceService.updateRequest(id, data);
  }

  @Put('requests/:id/assign')
  assignTechnician(@Param('id') id: string, @Body('technicianId') technicianId: string) {
    return this.maintenanceService.assignTechnician(id, technicianId);
  }

  @Put('requests/:id/start')
  startWork(@Param('id') id: string) {
    return this.maintenanceService.startWork(id);
  }

  @Put('requests/:id/complete')
  completeWork(@Param('id') id: string, @Body() data: any) {
    return this.maintenanceService.completeWork(id, data);
  }

  @Put('requests/:id/verify')
  verifyCompletion(@Param('id') id: string, @Body('notes') notes: string) {
    return this.maintenanceService.verifyCompletion(id, notes);
  }

  // Assets
  @Get('assets')
  getAllAssets() {
    return this.maintenanceService.getAllAssets();
  }

  @Get('assets/:id')
  getAssetById(@Param('id') id: string) {
    return this.maintenanceService.getAssetById(id);
  }

  @Post('assets')
  createAsset(@Body() data: any) {
    return this.maintenanceService.createAsset(data);
  }

  @Put('assets/:id')
  updateAsset(@Param('id') id: string, @Body() data: any) {
    return this.maintenanceService.updateAsset(id, data);
  }

  @Put('assets/:id/schedule')
  scheduleMaintenance(@Param('id') id: string, @Body('date') date: string) {
    return this.maintenanceService.scheduleMaintenance(id, new Date(date));
  }

  // Reports
  @Get('reports')
  getMaintenanceReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.maintenanceService.getMaintenanceReport(new Date(startDate), new Date(endDate));
  }
}
