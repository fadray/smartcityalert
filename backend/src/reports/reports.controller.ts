import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('daily')
  getDailyReport(@Query('date') date?: string) {
    const reportDate = date ? new Date(date) : undefined;
    return this.reportsService.getDailyReport(reportDate);
  }

  @Get('weekly')
  getWeeklyReport(@Query('startDate') startDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    return this.reportsService.getWeeklyReport(start);
  }

  @Get('monthly')
  getMonthlyReport(@Query('year') year?: string, @Query('month') month?: string) {
    const reportYear = year ? parseInt(year) : undefined;
    const reportMonth = month ? parseInt(month) - 1 : undefined;
    return this.reportsService.getMonthlyReport(reportYear, reportMonth);
  }

  @Get('by-type')
  getIncidentTypeReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportsService.getIncidentTypeReport(start, end);
  }

  @Get('by-department')
  getDepartmentReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportsService.getDepartmentReport(start, end);
  }

  @Get('by-responder')
  getResponderReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportsService.getResponderReport(start, end);
  }

  @Get('success-rate')
  getSuccessRateReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportsService.getSuccessRateReport(start, end);
  }

  @Get('trends')
  async getTrends(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportsService.getTrends(startDate, endDate);
  }
}
