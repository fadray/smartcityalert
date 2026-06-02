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
    const pending = incidents.filter(i => i.status !== 'closed');
    const escalated = incidents.filter(i => i.current_workflow_level > 1);
    
    const byType: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    
    incidents.forEach(i => {
      byType[i.incident_type] = (byType[i.incident_type] || 0) + 1;
      byDepartment[i.department?.name || 'Unknown'] = (byDepartment[i.department?.name || 'Unknown'] || 0) + 1;
    });
    
    return {
      date: startOfDay,
      total_incidents: incidents.length,
      resolved_incidents: resolved.length,
      pending_incidents: pending.length,
      escalated_incidents: escalated.length,
      success_rate: incidents.length > 0 ? (resolved.length / incidents.length) * 100 : 0,
      by_type: byType,
      by_department: byDepartment,
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
    
    return {
      week_start: start,
      week_end: end,
      total_incidents: incidents.length,
      resolved_incidents: resolved.length,
      success_rate: incidents.length > 0 ? (resolved.length / incidents.length) * 100 : 0,
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
    const escalated = incidents.filter(i => i.current_workflow_level > 1);
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
      start_date: startDate,
      end_date: endDate,
      total_incidents: incidents.length,
      resolved_incidents: resolved.length,
      pending_incidents: incidents.length - resolved.length,
      success_rate: incidents.length > 0 ? (resolved.length / incidents.length) * 100 : 0,
      failure_rate: incidents.length > 0 ? ((incidents.length - resolved.length) / incidents.length) * 100 : 0,
      escalation_rate: incidents.length > 0 ? (escalated.length / incidents.length) * 100 : 0,
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
        pending: typeIncidents.length - resolved.length,
        success_rate: typeIncidents.length > 0 ? (resolved.length / typeIncidents.length) * 100 : 0,
      };
    }
    
    return {
      period: { start, end },
      incident_types: incidentTypes,
      total_incidents: incidents.length,
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
    
    responderList.sort((a, b) => b.success_rate - a.success_rate);
    
    return {
      period: { start, end },
      responders: responderList,
      top_performer: responderList[0],
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
    
    departmentList.sort((a, b) => b.success_rate - a.success_rate);
    
    return {
      period: { start, end },
      departments: departmentList,
      best_performing: departmentList[0],
    };
  }

  async getSuccessRateReport(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 3));
    const end = endDate || new Date();
    
    const incidents = await this.incidentRepository.find({
      where: { created_at: Between(start, end) },
      relations: {
        department: true,
        assigned_to: true,
      },
    });
    
    const total = incidents.length;
    const resolved = incidents.filter(i => i.status === 'closed').length;
    const escalated = incidents.filter(i => i.current_workflow_level > 1).length;
    
    return {
      period: { start, end },
      overall: {
        total_incidents: total,
        resolved_incidents: resolved,
        pending_incidents: total - resolved,
        success_rate: total > 0 ? (resolved / total) * 100 : 0,
        failure_rate: total > 0 ? ((total - resolved) / total) * 100 : 0,
        escalation_rate: total > 0 ? (escalated / total) * 100 : 0,
      },
      recommendations: this.generateRecommendations(incidents),
    };
  }

  async getCombinedReport(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate || new Date(new Date().setDate(1));
    const end = endDate || new Date();
    
    const [monthly, byType, byResponder, byDepartment] = await Promise.all([
      this.getMonthlyReport(new Date().getFullYear(), new Date().getMonth()),
      this.getIncidentTypeReport(start, end),
      this.getResponderReport(start, end),
      this.getDepartmentReport(start, end),
    ]);
    
    return {
      period: { start, end },
      executive_summary: {
        total_incidents: monthly.total_incidents,
        resolved_incidents: monthly.resolved_incidents,
        overall_success_rate: monthly.success_rate,
        escalation_rate: monthly.escalation_rate,
      },
      monthly,
      by_incident_type: byType,
      by_responder: byResponder,
      by_department: byDepartment,
    };
  }

  async exportToCSV(reportType: string, params: any): Promise<string> {
    let data: any[] = [];
    
    switch (reportType) {
      case 'incidents':
        const incidents = await this.incidentRepository.find({
          where: { created_at: Between(params.startDate, params.endDate) },
          relations: {
            department: true,
            reported_by: true,
            assigned_to: true,
          },
        });
        data = incidents.map(i => ({
          'Incident ID': i.id,
          'Title': i.title,
          'Type': i.incident_type,
          'Department': i.department?.name,
          'Severity': i.severity_level,
          'Status': i.status,
          'Created At': i.created_at,
        }));
        break;
      case 'responders':
        const responderReport = await this.getResponderReport(params.startDate, params.endDate);
        data = responderReport.responders;
        break;
      case 'departments':
        const deptReport = await this.getDepartmentReport(params.startDate, params.endDate);
        data = deptReport.departments;
        break;
      default:
        return '';
    }
    
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return `"${String(value || '').replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  private generateRecommendations(incidents: any[]): string[] {
    const recommendations: string[] = [];
    const byType: Record<string, number> = {};
    
    incidents.forEach(i => {
      byType[i.incident_type] = (byType[i.incident_type] || 0) + 1;
    });
    
    const mostCommonType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    if (mostCommonType && mostCommonType[1] > 10) {
      recommendations.push(`High volume of ${mostCommonType[0]} incidents detected. Consider additional training for this incident type.`);
    }
    
    const escalationRate = incidents.filter(i => i.current_workflow_level > 1).length / incidents.length;
    if (escalationRate > 0.3) {
      recommendations.push(`High escalation rate (${Math.round(escalationRate * 100)}%). Review response protocols and initial responder training.`);
    }
    
    return recommendations;
  }
}
