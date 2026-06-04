import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Incident } from './incident.entity';
import { User } from '../users/user.entity';
import { Responder } from '../responders/responder.entity';

interface HistoryEntry {
  id: string;
  level: number;
  timestamp: string;
  action: string;
  reason: string;
  user_name: string;
  user_role: string;
  old_value?: string | number;
  new_value?: string | number;
  comments?: string;
  assignee_name?: string;
  proof_image?: string;
}

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Responder)
    private responderRepository: Repository<Responder>,
  ) {}

  async findAll(): Promise<Incident[]> {
    return this.incidentRepository.find({
      relations: {
        department: true,
        reported_by: true,
        assigned_to: {
          user: true,
        },
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
    const result = await this.incidentRepository.insert({
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
    });
    const id = result.identifiers[0].id;
    return this.findOne(id);
  }

  async updateStatus(id: string, status: string, userId?: string, userName?: string, userRole?: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    
    let history: HistoryEntry[] = [];
    if (incident.escalation_history) {
      try {
        if (typeof incident.escalation_history === 'string') {
          history = JSON.parse(incident.escalation_history);
        } else if (Array.isArray(incident.escalation_history)) {
          history = incident.escalation_history;
        }
      } catch (e) {}
    }
    
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      level: incident.current_workflow_level,
      timestamp: new Date().toISOString(),
      action: 'status_change',
      reason: `Status changed from ${incident.status} to ${status}`,
      user_name: userName || 'System',
      user_role: userRole || 'System',
      old_value: incident.status,
      new_value: status,
    };
    history.push(newEntry);
    
    await this.incidentRepository.update(id, { 
      status, 
      updated_at: new Date(),
      escalation_history: JSON.stringify(history),
    });
    
    return this.findOne(id);
  }

  async updateWorkflowLevel(id: string, level: number, userId?: string, userName?: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    
    const oldLevel = incident.current_workflow_level;
    
    let history: HistoryEntry[] = [];
    if (incident.escalation_history) {
      try {
        if (typeof incident.escalation_history === 'string') {
          history = JSON.parse(incident.escalation_history);
        } else if (Array.isArray(incident.escalation_history)) {
          history = incident.escalation_history;
        }
      } catch (e) {}
    }
    
    history.push({
      id: Date.now().toString(),
      level: level,
      timestamp: new Date().toISOString(),
      action: 'workflow_change',
      reason: `Workflow level changed from ${oldLevel} to ${level}`,
      user_name: userName || 'System',
      user_role: 'Admin',
      old_value: oldLevel,
      new_value: level,
    });
    
    await this.incidentRepository.update(id, { 
      current_workflow_level: level, 
      updated_at: new Date(),
      escalation_history: JSON.stringify(history),
    });
    
    return this.findOne(id);
  }

  async assignToUser(incidentId: string, assigneeId: string, assigneeType: string, comments: string, assignedById: string, assignedByName: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id: incidentId } });
    if (!incident) throw new NotFoundException('Incident not found');
    
    const oldAssignee = incident.assigned_to_id;
    
    let assigneeName = '';
    if (assigneeType === 'user') {
      const user = await this.userRepository.findOne({ where: { id: assigneeId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      assigneeName = user.full_name;
    } else {
      const responder = await this.responderRepository
        .createQueryBuilder('responder')
        .leftJoinAndSelect('responder.user', 'user')
        .where('responder.id = :id', { id: assigneeId })
        .getOne();
      if (!responder) {
        throw new NotFoundException('Responder not found');
      }
      assigneeName = responder.user?.full_name || 'Unknown';
    }
    
    let history: HistoryEntry[] = [];
    if (incident.escalation_history) {
      try {
        if (typeof incident.escalation_history === 'string') {
          history = JSON.parse(incident.escalation_history);
        } else if (Array.isArray(incident.escalation_history)) {
          history = incident.escalation_history;
        }
      } catch (e) {}
    }
    
    history.push({
      id: Date.now().toString(),
      level: incident.current_workflow_level,
      timestamp: new Date().toISOString(),
      action: 'assignment',
      reason: `Incident assigned to ${assigneeName}`,
      comments: comments,
      user_name: assignedByName,
      user_role: 'Supervisor',
      old_value: oldAssignee || 'unassigned',
      new_value: assigneeId,
      assignee_name: assigneeName,
    });
    
    await this.incidentRepository.update(incidentId, {
      assigned_to_id: assigneeId,
      assignee_type: assigneeType,
      status: 'assigned',
      updated_at: new Date(),
      escalation_history: JSON.stringify(history),
    });
    
    return this.findOne(incidentId);
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
    return this.incidentRepository.find({
      where: { 
        status: 'pending_approval',
      },
      relations: {
        department: true,
      },
    });
  }

  async uploadResolutionProof(
    id: string, 
    userId: string, 
    userName: string, 
    proofImage: string, 
    proofDescription: string,
    role: string
  ): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    
    let proofs: any[] = [];
    if (incident.resolution_proofs) {
      try {
        if (typeof incident.resolution_proofs === 'string') {
          proofs = JSON.parse(incident.resolution_proofs);
        } else if (Array.isArray(incident.resolution_proofs)) {
          proofs = incident.resolution_proofs;
        }
      } catch (e) {}
    }
    
    proofs.push({
      id: Date.now().toString(),
      level: incident.current_workflow_level,
      role: role,
      user_id: userId,
      user_name: userName,
      proof_image: proofImage,
      proof_description: proofDescription,
      uploaded_at: new Date().toISOString(),
    });
    
    let history: HistoryEntry[] = [];
    if (incident.escalation_history) {
      try {
        if (typeof incident.escalation_history === 'string') {
          history = JSON.parse(incident.escalation_history);
        } else if (Array.isArray(incident.escalation_history)) {
          history = incident.escalation_history;
        }
      } catch (e) {}
    }
    
    history.push({
      id: Date.now().toString(),
      level: incident.current_workflow_level,
      timestamp: new Date().toISOString(),
      action: 'resolution_proof',
      reason: `Resolution proof submitted: ${proofDescription}`,
      user_name: userName,
      user_role: role,
      proof_image: proofImage,
    });
    
    await this.incidentRepository.update(id, {
      resolution_proofs: JSON.stringify(proofs),
      escalation_history: JSON.stringify(history),
      status: 'pending_approval',
      updated_at: new Date(),
    });
    
    return this.findOne(id);
  }

  async approveResolution(
    id: string,
    approverId: string,
    approverName: string,
    role: string,
    comments: string,
    level: number
  ): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    
    let approvals: any[] = [];
    if (incident.approvals) {
      try {
        if (typeof incident.approvals === 'string') {
          approvals = JSON.parse(incident.approvals);
        } else if (Array.isArray(incident.approvals)) {
          approvals = incident.approvals;
        }
      } catch (e) {}
    }
    
    approvals.push({
      id: Date.now().toString(),
      level: level,
      role: role,
      approver_id: approverId,
      approver_name: approverName,
      status: 'approved',
      comments: comments,
      approved_at: new Date().toISOString(),
    });
    
    let history: HistoryEntry[] = [];
    if (incident.escalation_history) {
      try {
        if (typeof incident.escalation_history === 'string') {
          history = JSON.parse(incident.escalation_history);
        } else if (Array.isArray(incident.escalation_history)) {
          history = incident.escalation_history;
        }
      } catch (e) {}
    }
    
    history.push({
      id: Date.now().toString(),
      level: level,
      timestamp: new Date().toISOString(),
      action: 'approval',
      reason: `Resolution approved by ${approverName}`,
      comments: comments,
      user_name: approverName,
      user_role: role,
    });
    
    const updateData: any = {
      approvals: JSON.stringify(approvals),
      escalation_history: JSON.stringify(history),
      updated_at: new Date(),
    };
    
    if (level >= 6) {
      updateData.status = 'closed';
      updateData.resolved_at = new Date();
    } else {
      updateData.current_workflow_level = level + 1;
      updateData.status = 'pending_approval';
    }
    
    await this.incidentRepository.update(id, updateData);
    return this.findOne(id);
  }

  async rejectResolution(
    id: string,
    approverId: string,
    approverName: string,
    comments: string
  ): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    
    let history: HistoryEntry[] = [];
    if (incident.escalation_history) {
      try {
        if (typeof incident.escalation_history === 'string') {
          history = JSON.parse(incident.escalation_history);
        } else if (Array.isArray(incident.escalation_history)) {
          history = incident.escalation_history;
        }
      } catch (e) {}
    }
    
    history.push({
      id: Date.now().toString(),
      level: incident.current_workflow_level,
      timestamp: new Date().toISOString(),
      action: 'rejection',
      reason: `Resolution rejected: ${comments}`,
      user_name: approverName,
      user_role: 'Approver',
    });
    
    await this.incidentRepository.update(id, {
      status: 'reopened',
      resolution_proofs: JSON.stringify([]),
      escalation_history: JSON.stringify(history),
      updated_at: new Date(),
    });
    return this.findOne(id);
  }
}
