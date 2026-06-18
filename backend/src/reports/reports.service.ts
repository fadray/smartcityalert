import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Incident } from '../incidents/incident.entity';
import { User } from '../users/user.entity';
import { Department } from '../departments/department.entity';
import { Responder } from '../responders/responder.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(Responder)
    private responderRepository: Repository<Responder>,
  ) {}

  async getDailyReport(date?: Date): Promise<any> {
    const reportDate = date || new Date();
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const incidents = await this.incidentRepository.find({
      where: { created_at: Between(startOfDay, endOfDay) },
      relations: {
        department: true,
        reported_by: true,
        assigned_to: true,
      },
    });
    
    const resolved = incidents.filter(i => i.status === 'closed');
    const avgTime = this.calculateAvgResolutionTime(incidents);
    
    return {
      date: startOfDay,
      total_incidents: incidents.length,
      resolved_incidents: resolved.length,
      success_rate: incidents.length > 0 ? (resolved.length / incidents.length) * 100 : 0,
      avg_resolution_time_minutes: avgTime,
    };
  }

  async getWeeklyReport(startDate?: Date): Promise<any> {
    const start = startDate || new Date();
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    const incidents = await this.incidentRepository.find({
      where: { created_at: Between(start, end) },
      relations: {
        department: true,
      },
    });
    
    const resolved = incidents.filter(i => i.status === 'closed');
    const avgTime = this.calculateAvgResolutionTime(incidents);
    
    return {
      week_start: start,
      week_end: end,
      total_incidents: incidents.length,
      resolved_incidents: resolved.length,
      success_rate: incidents.length > 0 ? (resolved.length / incidents.length) * 100 : 0,
      avg_resolution_time_minutes: avgTime,
    };
  }

  async getMonthlyReport(year?: number, month?: number): Promise<any> {
    const reportYear = year || new Date().getFullYear();
    const reportMonth = month !== undefined ? month : new Date().getMonth();
    
    const startDate = new Date(reportYear, reportMonth, 1);
    const endDate = new Date(reportYear, reportMonth + 1, 0, 23, 59, 59, 999);
    
    const incidents = await this.incidentRepository.find({
      where: { created_at: Between(startDate, endDate) },
      relations: {
        department: true,
        reported_by: true,
        assigned_to: true,
      },
    });
    
    const resolved = incidents.filter(i => i.status === 'closed');
    const avgTime = this.calculateAvgResolutionTime(incidents);
    
    const byType: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    
    incidents.forEach(i => {
      byType[i.incident_type] = (byType[i.incident_type] || 0) + 1;
      byDepartment[i.department?.name || 'Unknown'] = (byDepartment[i.department?.name || 'Unknown'] || 0) + 1;
    });
    
    return {
      month: reportMonth + 1,
      year: reportYear,
      month_name: new Date(reportYear, reportMonth).toLocaleString('default', { month: 'long' }),
      total_incidents: incidents.length,
      resolved_incidents: resolved.length,
      success_rate: incidents.length > 0 ? (resolved.length / incidents.length) * 100 : 0,
      avg_resolution_time_minutes: avgTime,
      by_type: byType,
      by_department: byDepartment,
    };
  }

  async getIncidentTypeReport(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate || new Date(new Date().setDate(1));
    const end = endDate || new Date();
    
    const incidents = await this.incidentRepository.find({
      where: { created_at: Between(start, end) },
      relations: {
        department: true,
      },
    });
    
    const types = ['medical', 'fire', 'security', 'maintenance'];
    const incidentTypes: Record<string, any> = {};
    
    for (const type of types) {
      const typeIncidents = incidents.filter(i => i.incident_type === type);
      const resolved = typeIncidents.filter(i => i.status === 'closed');
      incidentTypes[type] = {
        total: typeIncidents.length,
        resolved: resolved.length,
        success_rate: typeIncidents.length > 0 ? (resolved.length / typeIncidents.length) * 100 : 0,
      };
    }
    
    return {
      period: { start, end },
      incident_types: incidentTypes,
    };
  }

  async getDepartmentReport(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate || new Date(new Date().setDate(1));
    const end = endDate || new Date();
    
    const departments = await this.departmentRepository.find();
    const departmentList: any[] = [];
    
    for (const department of departments) {
      const incidents = await this.incidentRepository.find({
        where: {
          department_id: department.id,
          created_at: Between(start, end),
        },
      });
      
      const resolved = incidents.filter(i => i.status === 'closed');
      
      departmentList.push({
        department_id: department.id,
        department_name: department.name,
        color: department.color,
        total_incidents: incidents.length,
        resolved_incidents: resolved.length,
        success_rate: incidents.length > 0 ? (resolved.length / incidents.length) * 100 : 0,
      });
    }
    
    return {
      period: { start, end },
      departments: departmentList,
    };
  }

  async getResponderReport(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate || new Date(new Date().setDate(1));
    const end = endDate || new Date();
    
    const responders = await this.responderRepository.find({
      relations: {
        user: true,
        department: true,
      },
    });
    
    const responderList: any[] = [];
    
    for (const responder of responders) {
      const incidents = await this.incidentRepository.find({
        where: {
          assigned_to_id: responder.id,
          created_at: Between(start, end),
        },
      });
      
      const resolved = incidents.filter(i => i.status === 'closed');
      
      responderList.push({
        responder_id: responder.id,
        name: responder.user?.full_name || 'Unknown',
        department: responder.department?.name || 'Unknown',
        total_assigned: incidents.length,
        resolved_count: resolved.length,
        success_rate: incidents.length > 0 ? (resolved.length / incidents.length) * 100 : 0,
      });
    }
    
    return {
      period: { start, end },
      responders: responderList,
    };
  }

  async getSuccessRateReport(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 3));
    const end = endDate || new Date();
    
    const incidents = await this.incidentRepository.find({
      where: { created_at: Between(start, end) },
    });
    
    const total = incidents.length;
    const resolved = incidents.filter(i => i.status === 'closed').length;
    
    // Calculate SLA compliance
    const withinSLA = incidents.filter(i => {
      if (!i.resolved_at) return false;
      const resolutionTime = new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime();
      const slaLimit = i.severity_level === 1 ? 3600000 :
                       i.severity_level === 2 ? 1800000 :
                       i.severity_level === 3 ? 900000 : 300000;
      return resolutionTime <= slaLimit;
    }).length;
    
    return {
      period: { start, end },
      overall: {
        total_incidents: total,
        resolved_incidents: resolved,
        success_rate: total > 0 ? (resolved / total) * 100 : 0,
        failure_rate: total > 0 ? ((total - resolved) / total) * 100 : 0,
        sla_compliance_rate: total > 0 ? (withinSLA / total) * 100 : 0,
      },
    };
  }

  async getTrends(startDate: string, endDate: string): Promise<any[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const trends: any[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const incidents = await this.incidentRepository.find({
        where: { created_at: Between(dayStart, dayEnd) },
      });
      
      trends.push({
        date: currentDate.toISOString().split('T')[0],
        incidents: incidents.length,
        resolved: incidents.filter(i => i.status === 'closed' || i.status === 'resolved').length,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return trends;
  }

  private calculateAvgResolutionTime(incidents: Incident[]): number {
    const resolved = incidents.filter(i => i.resolved_at);
    if (resolved.length === 0) return 0;
    
    const totalTime = resolved.reduce((sum, i) => {
      const time = new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime();
      return sum + time;
    }, 0);
    
    return Math.round(totalTime / resolved.length / 60000);
  }
}
