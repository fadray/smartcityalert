import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Incident } from './incident.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
  ) {}

  async findAll(): Promise<Incident[]> {
    return this.incidentRepository.find({
      relations: {
        department: true,
        reported_by: true,
        assigned_to: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async findActive(): Promise<Incident[]> {
    return this.incidentRepository.find({
      where: { 
        status: In(['pending', 'acknowledged', 'assigned', 'in_progress', 'escalated']),
      },
      relations: {
        department: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: {
        department: true,
        reported_by: true,
        assigned_to: {
          user: true,
        },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async create(createIncidentDto: any, userId: string, images?: string[]): Promise<Incident> {
    // Simple insert without complex types
    const newIncident = {
      title: createIncidentDto.title,
      description: createIncidentDto.description,
      incident_type: createIncidentDto.incident_type,
      department_id: createIncidentDto.department_id,
      severity_level: createIncidentDto.severity_level || 1,
      latitude: createIncidentDto.latitude || 0,
      longitude: createIncidentDto.longitude || 0,
      reported_by_id: userId,
      images: JSON.stringify(images || []),
      status: 'pending',
      current_workflow_level: 1,
      escalation_history: JSON.stringify([]),
      resolution_proofs: JSON.stringify([]),
      approvals: JSON.stringify([]),
    };
    
    const result = await this.incidentRepository.insert(newIncident);
    const id = result.identifiers[0].id;
    return this.findOne(id);
  }

  async updateStatus(id: string, status: string): Promise<Incident> {
    await this.incidentRepository.update(id, { status, updated_at: new Date() });
    return this.findOne(id);
  }

  async updateWorkflowLevel(id: string, level: number): Promise<Incident> {
    await this.incidentRepository.update(id, { current_workflow_level: level, updated_at: new Date() });
    return this.findOne(id);
  }

  async getStats(): Promise<any> {
    const active = await this.incidentRepository.count({
      where: { status: In(['pending', 'acknowledged', 'assigned', 'in_progress', 'escalated', 'pending_approval']) },
    });
    
    const pendingApproval = await this.incidentRepository.count({
      where: { status: 'pending_approval' },
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await this.incidentRepository.count({
      where: { created_at: today as any },
    });
    
    const byDepartment = await this.incidentRepository
      .createQueryBuilder('incident')
      .select('department.name', 'name')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('incident.department', 'department')
      .groupBy('department.name')
      .getRawMany();
    
    return { 
      active_incidents: active, 
      pending_approvals: pendingApproval,
      today_incidents: todayCount, 
      by_department: byDepartment 
    };
  }

  async getPendingApprovals(role: string, userId: string): Promise<Incident[]> {
    return [];
  }

  async uploadResolutionProof(id: string, userId: string, userName: string, proofImage: string, proofDescription: string, role: string): Promise<Incident> {
    return this.findOne(id);
  }

  async approveResolution(id: string, approverId: string, approverName: string, role: string, comments: string, level: number): Promise<Incident> {
    return this.findOne(id);
  }

  async rejectResolution(id: string, approverId: string, approverName: string, comments: string): Promise<Incident> {
    return this.findOne(id);
  }
}
