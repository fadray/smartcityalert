import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Incident } from './incident.entity';
import { User } from '../users/user.entity';
import { Responder } from '../responders/responder.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { GeocodingService } from '../geocoding/geocoding.service';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Responder)
    private responderRepository: Repository<Responder>,
    private notificationsService: NotificationsService,
    private geocodingService: GeocodingService,
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
    this.logger.log(`Creating incident: ${createIncidentDto.title}`);
    this.logger.log(`Location received: ${createIncidentDto.location || 'Not provided'}`);

    let latitude = createIncidentDto.latitude || null;
    let longitude = createIncidentDto.longitude || null;
    let address = createIncidentDto.address || null;
    const locationText = createIncidentDto.location || null;

    if (locationText && !latitude && !longitude) {
      this.logger.log(`Geocoding location: "${locationText}"`);
      try {
        const geocodeResult = await this.geocodingService.geocodeLocation(locationText);
        if (geocodeResult.latitude && geocodeResult.longitude) {
          latitude = geocodeResult.latitude;
          longitude = geocodeResult.longitude;
          address = geocodeResult.formattedAddress || address;
          this.logger.log(`Geocoded to: ${latitude}, ${longitude}`);
        } else {
          this.logger.warn(`Could not geocode location: "${locationText}"`);
          address = locationText;
        }
      } catch (error) {
        this.logger.error(`Geocoding error: ${error.message}`);
        address = locationText;
      }
    }

    if (latitude && longitude && !address) {
      this.logger.log(`Reverse geocoding coordinates: ${latitude}, ${longitude}`);
      try {
        const reverseResult = await this.geocodingService.reverseGeocode(latitude, longitude);
        address = reverseResult.formattedAddress || address;
      } catch (error) {
        this.logger.error(`Reverse geocoding error: ${error.message}`);
      }
    }

    const result = await this.incidentRepository.insert({
      title: createIncidentDto.title,
      description: createIncidentDto.description,
      incident_type: createIncidentDto.incident_type,
      department_id: createIncidentDto.department_id || null,
      severity_level: createIncidentDto.severity_level || 1,
      latitude: latitude || 0,
      longitude: longitude || 0,
      location: locationText,
      address: address || null,
      reported_by_id: userId,
      images: JSON.stringify(images || []),
      status: 'pending',
      current_workflow_level: 1,
      escalation_history: [],
      resolution_proofs: [],
      approvals: [],
    });
    const id = result.identifiers[0].id;
    const incident = await this.findOne(id);
    
    await this.notificationsService.notifyNewIncident(incident);
    
    return incident;
  }

  async updateStatus(id: string, status: string, userId?: string, userName?: string, userRole?: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    
    const oldStatus = incident.status;
    
    let history: any[] = [];
    if (incident.escalation_history) {
      try {
        history = typeof incident.escalation_history === 'string' 
          ? JSON.parse(incident.escalation_history) 
          : incident.escalation_history;
      } catch (e) {}
    }
    
    history.push({
      id: Date.now().toString(),
      level: incident.current_workflow_level,
      timestamp: new Date().toISOString(),
      action: 'status_change',
      reason: `Status changed from ${incident.status} to ${status}`,
      user_name: userName || 'System',
      user_role: userRole || 'System',
      old_value: incident.status,
      new_value: status,
    });
    
    await this.incidentRepository.update(id, { 
      status, 
      updated_at: new Date(),
      escalation_history: history,
    });
    
    const updatedIncident = await this.findOne(id);
    
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        await this.notificationsService.notifyStatusChange(updatedIncident, oldStatus, status, user);
      }
    }
    
    return updatedIncident;
  }

  async updateWorkflowLevel(id: string, level: number, userId?: string, userName?: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    
    const oldLevel = incident.current_workflow_level;
    
    let history: any[] = [];
    if (incident.escalation_history) {
      try {
        history = typeof incident.escalation_history === 'string' 
          ? JSON.parse(incident.escalation_history) 
          : incident.escalation_history;
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
      escalation_history: history,
    });
    
    const updatedIncident = await this.findOne(id);
    await this.notificationsService.notifyEscalation(updatedIncident, level);
    
    return updatedIncident;
  }

  async assignToUser(incidentId: string, assigneeId: string, assigneeType: string, comments: string, assignedById: string, assignedByName: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id: incidentId } });
    if (!incident) throw new NotFoundException('Incident not found');
    
    const oldAssignee = incident.assigned_to_id;
    
    let assigneeName = '';
    let assigneeUser: User | null = null;
    
    if (assigneeType === 'user') {
      assigneeUser = await this.userRepository.findOne({ where: { id: assigneeId } });
      if (!assigneeUser) {
        throw new NotFoundException('User not found');
      }
      assigneeName = assigneeUser.full_name;
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
      assigneeUser = responder.user;
    }
    
    let history: any[] = [];
    if (incident.escalation_history) {
      try {
        history = typeof incident.escalation_history === 'string' 
          ? JSON.parse(incident.escalation_history) 
          : incident.escalation_history;
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
      escalation_history: history,
    });
    
    const updatedIncident = await this.findOne(incidentId);
    
    const assignedBy = await this.userRepository.findOne({ where: { id: assignedById } });
    if (assigneeUser && assignedBy) {
      await this.notificationsService.notifyAssignment(updatedIncident, assigneeUser, assignedBy);
    }
    
    return updatedIncident;
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
        proofs = typeof incident.resolution_proofs === 'string' 
          ? JSON.parse(incident.resolution_proofs) 
          : incident.resolution_proofs;
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
    
    let history: any[] = [];
    if (incident.escalation_history) {
      try {
        history = typeof incident.escalation_history === 'string' 
          ? JSON.parse(incident.escalation_history) 
          : incident.escalation_history;
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
      resolution_proofs: proofs,
      escalation_history: history,
      status: 'pending_approval',
      updated_at: new Date(),
    });
    
    const updatedIncident = await this.findOne(id);
    const submitter = await this.userRepository.findOne({ where: { id: userId } });
    if (submitter) {
      await this.notificationsService.notifyResolutionProof(updatedIncident, submitter);
    }
    
    return updatedIncident;
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
        approvals = typeof incident.approvals === 'string' 
          ? JSON.parse(incident.approvals) 
          : incident.approvals;
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
    
    let history: any[] = [];
    if (incident.escalation_history) {
      try {
        history = typeof incident.escalation_history === 'string' 
          ? JSON.parse(incident.escalation_history) 
          : incident.escalation_history;
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
      approvals: approvals,
      escalation_history: history,
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
    const updatedIncident = await this.findOne(id);
    const approver = await this.userRepository.findOne({ where: { id: approverId } });
    if (approver) {
      await this.notificationsService.notifyApproval(updatedIncident, approver, 'approved');
    }
    
    return updatedIncident;
  }

  async rejectResolution(
    id: string,
    approverId: string,
    approverName: string,
    comments: string
  ): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');
    
    let history: any[] = [];
    if (incident.escalation_history) {
      try {
        history = typeof incident.escalation_history === 'string' 
          ? JSON.parse(incident.escalation_history) 
          : incident.escalation_history;
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
      resolution_proofs: [],
      escalation_history: history,
      updated_at: new Date(),
    });
    
    const updatedIncident = await this.findOne(id);
    const approver = await this.userRepository.findOne({ where: { id: approverId } });
    if (approver) {
      await this.notificationsService.notifyApproval(updatedIncident, approver, 'rejected');
    }
    
    return updatedIncident;
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

  // ✅ FINAL FIX: Use insert() with null for optional fields
 async createFromWhatsApp(data: {
  phoneNumber: string;
  message: string;
  detectedType: string;
  departmentId?: string;
  severity?: number;
  locationHint?: string;
  mediaUrl?: string;
  userId?: string;
}) {
  let latitude = 0;
  let longitude = 0;
  let address: string | undefined = undefined;

  const locationText = data.locationHint ?? undefined;

  if (locationText) {
    try {
      this.logger.log(`Geocoding WhatsApp location: "${locationText}"`);

      const geocodeResult =
        await this.geocodingService.geocodeLocation(locationText);

      if (geocodeResult.latitude && geocodeResult.longitude) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;

        address = geocodeResult.formattedAddress ?? undefined;

        this.logger.log(
          `Geocoded to: ${latitude}, ${longitude}`
        );
      }

    } catch (error) {
      this.logger.warn(
        `Could not geocode WhatsApp location: ${error.message}`
      );
    }
  }


  const newIncident = new Incident();

  newIncident.title =
    `${data.detectedType.toUpperCase()} Report via WhatsApp`;

  newIncident.description = data.message;

  newIncident.incident_type =
    data.detectedType;


  // Foreign keys
  newIncident.department_id =
    data.departmentId || '';


  newIncident.severity_level =
    data.severity ?? 2;


  newIncident.status =
    'pending';


  // Location
  newIncident.latitude =
    latitude;

  newIncident.longitude =
    longitude;

 newIncident.location =
    locationText || '';

  newIncident.address =
    address || '';


  // Media
  newIncident.images =
    data.mediaUrl
      ? JSON.stringify([data.mediaUrl])
      : JSON.stringify([]);


  // Reporter
  newIncident.reported_by_id =
    data.userId || '';


  newIncident.current_workflow_level =
    1;


  // History
  newIncident.escalation_history =
    [
      {
        timestamp: new Date().toISOString(),
        source: 'whatsapp',
        location_hint:
          data.locationHint ?? undefined,
        phone_number:
          data.phoneNumber ?? undefined,
      },
    ] as any;


  newIncident.resolution_proofs =
    [];


  newIncident.approvals =
    [];


  const saved =
    await this.incidentRepository.save(newIncident);


  this.logger.log(
    `WhatsApp incident created: ${saved.id} from ${data.phoneNumber}`
  );


  await this.notificationsService.notifyNewIncident(saved);


  return saved;
}

  async findByWhatsAppNumber(phoneNumber: string): Promise<Incident[]> {
    return this.incidentRepository
      .createQueryBuilder('incident')
      .where('incident.escalation_history::text LIKE :phone', { phone: `%${phoneNumber}%` })
      .orderBy('incident.created_at', 'DESC')
      .getMany();
  }
}
