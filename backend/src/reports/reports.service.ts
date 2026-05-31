import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Incident } from '../incidents/incident.entity';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Incident)
    private incidentRepo: Repository<Incident>,
  ) {}

  async getDepartmentPerformance(departmentId: string, startDate: Date, endDate: Date): Promise<any> {
    const incidents = await this.incidentRepo.find({
      where: {
        department_id: departmentId,
        created_at: Between(startDate, endDate),
      },
    });
    
    const total = incidents.length;
    const resolved = incidents.filter(i => i.status === 'resolved').length;
    const escalated = incidents.filter(i => i.current_workflow_level > 1).length;
    const successRate = total > 0 ? (resolved / total) * 100 : 0;
    
    // Calculate average response time
    const avgResponseTime = incidents
      .filter(i => i.acknowledged_at)
      .reduce((sum, i) => {
        const time = new Date(i.acknowledged_at).getTime() - new Date(i.created_at).getTime();
        return sum + time;
      }, 0) / (incidents.filter(i => i.acknowledged_at).length || 1);
    
    return {
      department_id: departmentId,
      period: { start: startDate, end: endDate },
      total_incidents: total,
      resolved_incidents: resolved,
      pending_incidents: total - resolved,
      escalated_incidents: escalated,
      success_rate: successRate.toFixed(2),
      avg_response_time_minutes: Math.round(avgResponseTime / 60000),
      sla_achievement: await this.getSLAAchievement(departmentId, startDate, endDate),
    };
  }

  async getResponderPerformance(responderId: string, startDate: Date, endDate: Date): Promise<any> {
    const incidents = await this.incidentRepo.find({
      where: {
        assigned_to: responderId,
        resolved_at: Between(startDate, endDate),
      },
    });
    
    const resolved = incidents.filter(i => i.status === 'resolved').length;
    const avgResolutionTime = incidents.reduce((sum, i) => {
      const time = new Date(i.resolved_at).getTime() - new Date(i.assigned_at).getTime();
      return sum + time;
    }, 0) / (incidents.length || 1);
    
    return {
      responder_id: responderId,
      period: { start: startDate, end: endDate },
      total_assigned: incidents.length,
      resolved_count: resolved,
      success_rate: incidents.length > 0 ? (resolved / incidents.length) * 100 : 0,
      avg_resolution_time_minutes: Math.round(avgResolutionTime / 60000),
    };
  }

  async getSLAAchievement(departmentId: string, startDate: Date, endDate: Date): Promise<any> {
    const incidents = await this.incidentRepo.find({
      where: {
        department_id: departmentId,
        created_at: Between(startDate, endDate),
        resolved_at: MoreThan(new Date()),
      },
    });
    
    const slaMet = incidents.filter(i => {
      const resolutionTime = new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime();
      const slaLimit = i.severity_level === 1 ? 60 : // 1 hour for low severity
                       i.severity_level === 2 ? 30 : // 30 min for medium
                       i.severity_level === 3 ? 15 : // 15 min for high
                       i.severity_level >= 4 ? 5 : 60; // 5 min for critical
      return resolutionTime <= slaLimit * 60000;
    }).length;
    
    return {
      total_incidents: incidents.length,
      sla_met: slaMet,
      sla_missed: incidents.length - slaMet,
      sla_percentage: incidents.length > 0 ? (slaMet / incidents.length) * 100 : 0,
    };
  }

  async generateExcelReport(reportType: string, params: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    
    // Add headers
    worksheet.columns = [
      { header: 'Incident ID', key: 'id', width: 30 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Severity', key: 'severity', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Resolved At', key: 'resolved_at', width: 20 },
      { header: 'Response Time', key: 'response_time', width: 15 },
    ];
    
    // Fetch data based on report type
    let incidents = [];
    if (reportType === 'department') {
      incidents = await this.incidentRepo.find({
        where: { department_id: params.departmentId },
        relations: ['assigned_to'],
      });
    } else {
      incidents = await this.incidentRepo.find();
    }
    
    // Add rows
    for (const incident of incidents) {
      const responseTime = incident.acknowledged_at
        ? Math.round((new Date(incident.acknowledged_at).getTime() - new Date(incident.created_at).getTime()) / 60000)
        : 'Pending';
      
      worksheet.addRow({
        id: incident.id,
        title: incident.title,
        type: incident.incident_type,
        severity: incident.severity_level,
        status: incident.status,
        created_at: new Date(incident.created_at).toLocaleString(),
        resolved_at: incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : 'Pending',
        response_time: responseTime + ' min',
      });
    }
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };
    
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generatePDFReport(incidentId: string): Promise<Buffer> {
    const incident = await this.incidentRepo.findOne({
      where: { id: incidentId },
      relations: ['reported_by', 'assigned_to', 'assigned_to.user'],
    });
    
    return new Promise((resolve) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument();
      
      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Header
      doc.fontSize(20).text('SmartCityAlert - Incident Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Report Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      
      // Incident Details
      doc.fontSize(16).text('Incident Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Incident ID: ${incident.id}`);
      doc.text(`Title: ${incident.title}`);
      doc.text(`Type: ${incident.incident_type}`);
      doc.text(`Severity: Level ${incident.severity_level}`);
      doc.text(`Status: ${incident.status}`);
      doc.text(`Description: ${incident.description || 'N/A'}`);
      doc.moveDown();
      
      // Timeline
      doc.fontSize(16).text('Timeline', { underline: true });
      doc.moveDown(0.5);
      doc.text(`Reported: ${new Date(incident.created_at).toLocaleString()}`);
      if (incident.acknowledged_at) {
        doc.text(`Acknowledged: ${new Date(incident.acknowledged_at).toLocaleString()}`);
      }
      if (incident.resolved_at) {
        doc.text(`Resolved: ${new Date(incident.resolved_at).toLocaleString()}`);
      }
      doc.moveDown();
      
      // Escalation History
      doc.fontSize(16).text('Escalation History', { underline: true });
      doc.moveDown(0.5);
      incident.escalation_history.forEach((event: any, index: number) => {
        doc.text(`${index + 1}. Level ${event.level} - ${new Date(event.timestamp).toLocaleString()}`);
        doc.text(`   Reason: ${event.reason}`);
      });
      
      doc.end();
    });
  }

  async getDashboardStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeIncidents = await this.incidentRepo.count({
      where: { status: ['pending', 'acknowledged', 'assigned', 'in_progress', 'escalated'] },
    });
    
    const todayIncidents = await this.incidentRepo.count({
      where: { created_at: MoreThan(today) },
    });
    
    const resolvedToday = await this.incidentRepo.count({
      where: { resolved_at: MoreThan(today), status: 'resolved' },
    });
    
    const avgResponse = await this.incidentRepo
      .createQueryBuilder('incident')
      .select('AVG(EXTRACT(EPOCH FROM (incident.acknowledged_at - incident.created_at)))', 'avg')
      .where('incident.acknowledged_at IS NOT NULL')
      .getRawOne();
    
    const byDepartment = await this.incidentRepo
      .createQueryBuilder('incident')
      .select('d.name', 'department')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('departments', 'd', 'd.id = incident.department_id')
      .groupBy('d.name')
      .getRawMany();
    
    return {
      active_incidents: activeIncidents,
      today_incidents: todayIncidents,
      resolved_today: resolvedToday,
      avg_response_time_seconds: parseInt(avgResponse?.avg || 0),
      by_department: byDepartment,
      success_rate: await this.getOverallSuccessRate(),
    };
  }

  async getOverallSuccessRate(): Promise<number> {
    const total = await this.incidentRepo.count();
    const resolved = await this.incidentRepo.count({ where: { status: 'resolved' } });
    return total > 0 ? (resolved / total) * 100 : 0;
  }
}
