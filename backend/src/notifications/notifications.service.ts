import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from './notification.entity';
import { User } from '../users/user.entity';
import { EmailService } from './email.service';
import { Incident } from '../incidents/incident.entity';
import { Department } from '../departments/department.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    private emailService: EmailService,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    incidentId?: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user_id: userId,
      title,
      message,
      type,
      incident_id: incidentId,
      priority,
    });
    return this.notificationRepository.save(notification);
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user_id: userId, is_read: false },
      order: { created_at: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, user_id: userId },
      { is_read: true },
    );
  }

  async getUsersInDepartment(departmentId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { department_id: departmentId, is_active: true },
    });
  }

  async getUsersByRole(role: string, departmentId?: string): Promise<User[]> {
    const query: any = { role, is_active: true };
    if (departmentId) {
      query.department_id = departmentId;
    }
    return this.userRepository.find({ where: query });
  }

  async notifyNewIncident(incident: Incident): Promise<void> {
    // Notify all users in the same department
    const users = await this.getUsersInDepartment(incident.department_id);
    
    for (const user of users) {
      // Skip the reporter
      if (user.id === incident.reported_by_id) continue;
      
      // Create in-app notification
      await this.createNotification(
        user.id,
        '🚨 New Incident Reported',
        `${incident.title} - ${incident.incident_type} - Severity Level ${incident.severity_level}`,
        NotificationType.NEW_INCIDENT,
        incident.id,
        incident.severity_level >= 4 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      );
      
      // Send email if user has email
      if (user.email) {
        await this.emailService.sendNewIncidentNotification(
          user.email,
          user.full_name,
          incident,
        );
      }
    }
    
    this.logger.log(`Sent new incident notifications to ${users.length} users`);
  }

  async notifyStatusChange(incident: Incident, oldStatus: string, newStatus: string, changedBy: User): Promise<void> {
    // Get all users in the department
    const users = await this.getUsersInDepartment(incident.department_id);
    
    for (const user of users) {
      if (user.id === changedBy.id) continue;
      
      await this.createNotification(
        user.id,
        `📊 Status Update: ${incident.title}`,
        `Status changed from ${oldStatus} to ${newStatus} by ${changedBy.full_name}`,
        NotificationType.STATUS_CHANGE,
        incident.id,
      );
      
      if (user.email) {
        // Send email for important status changes
        if (newStatus === 'resolved' || newStatus === 'closed') {
          await this.emailService.sendApprovalNotification(
            user.email,
            user.full_name,
            incident,
            'Resolved',
          );
        }
      }
    }
    
    this.logger.log(`Sent status change notifications to ${users.length} users`);
  }

  async notifyAssignment(incident: Incident, assignee: User, assignedBy: User): Promise<void> {
    // Notify the assignee
    await this.createNotification(
      assignee.id,
      `📋 Incident Assigned to You`,
      `You have been assigned to: ${incident.title} by ${assignedBy.full_name}`,
      NotificationType.ASSIGNMENT,
      incident.id,
      NotificationPriority.HIGH,
    );
    
    if (assignee.email) {
      await this.emailService.sendAssignmentNotification(
        assignee.email,
        assignee.full_name,
        incident,
        assignedBy.full_name,
      );
    }
    
    // Also notify department supervisor
    const supervisors = await this.getUsersByRole('supervisor', incident.department_id);
    for (const supervisor of supervisors) {
      if (supervisor.id === assignee.id) continue;
      
      await this.createNotification(
        supervisor.id,
        `👥 Incident Assigned`,
        `${incident.title} has been assigned to ${assignee.full_name} by ${assignedBy.full_name}`,
        NotificationType.ASSIGNMENT,
        incident.id,
      );
    }
    
    this.logger.log(`Sent assignment notifications to assignee and supervisors`);
  }

  async notifyEscalation(incident: Incident, level: number): Promise<void> {
    // Determine which role to notify based on escalation level
    let targetRole = '';
    if (level === 2) targetRole = 'supervisor';
    else if (level === 3) targetRole = 'hod';
    else if (level === 4) targetRole = 'dept_director';
    else if (level === 5) targetRole = 'overall_manager';
    else if (level >= 6) targetRole = 'overall_director';
    
    if (!targetRole) return;
    
    const users = await this.getUsersByRole(targetRole, incident.department_id);
    
    for (const user of users) {
      await this.createNotification(
        user.id,
        `⚠️ Incident Escalated to Level ${level}`,
        `${incident.title} has been escalated to Level ${level}. Immediate attention required.`,
        NotificationType.ESCALATION,
        incident.id,
        NotificationPriority.URGENT,
      );
      
      if (user.email) {
        await this.emailService.sendEscalationNotification(
          user.email,
          user.full_name,
          incident,
          level,
        );
      }
    }
    
    this.logger.log(`Sent escalation notifications to ${users.length} users at level ${level}`);
  }

  async notifyResolutionProof(incident: Incident, proofSubmitter: User): Promise<void> {
    // Notify supervisors and HODs
    const supervisors = await this.getUsersByRole('supervisor', incident.department_id);
    const hods = await this.getUsersByRole('hod', incident.department_id);
    const targets = [...supervisors, ...hods];
    
    for (const user of targets) {
      await this.createNotification(
        user.id,
        `📎 Resolution Proof Submitted`,
        `${proofSubmitter.full_name} has submitted resolution proof for: ${incident.title}`,
        NotificationType.RESOLUTION_PROOF,
        incident.id,
        NotificationPriority.HIGH,
      );
      
      if (user.email) {
        await this.emailService.sendApprovalNotification(
          user.email,
          user.full_name,
          incident,
          'Resolution Proof Submitted',
        );
      }
    }
    
    this.logger.log(`Sent resolution proof notifications to ${targets.length} users`);
  }

  async notifyApproval(incident: Incident, approver: User, status: string): Promise<void> {
    // Notify supervisors, HODs, and the responder
    const supervisors = await this.getUsersByRole('supervisor', incident.department_id);
    const hods = await this.getUsersByRole('hod', incident.department_id);
    
    // Also notify the assigned responder if exists
    let targets = [...supervisors, ...hods];
    if (incident.assigned_to_id) {
      const responder = await this.userRepository.findOne({ where: { id: incident.assigned_to_id } });
      if (responder) targets.push(responder);
    }
    
    // Notify the original reporter as well
    if (incident.reported_by_id) {
      const reporter = await this.userRepository.findOne({ where: { id: incident.reported_by_id } });
      if (reporter) targets.push(reporter);
    }
    
    // Remove duplicates
    const uniqueTargets = [...new Map(targets.map(t => [t.id, t])).values()];
    
    for (const user of uniqueTargets) {
      if (user.id === approver.id) continue;
      
      await this.createNotification(
        user.id,
        status === 'approved' ? '✅ Incident Approved' : '❌ Incident Rejected',
        `${approver.full_name} has ${status} the resolution for: ${incident.title}`,
        NotificationType.APPROVAL,
        incident.id,
        NotificationPriority.HIGH,
      );
      
      if (user.email) {
        await this.emailService.sendApprovalNotification(
          user.email,
          user.full_name,
          incident,
          status === 'approved' ? 'Approved' : 'Rejected',
        );
      }
    }
    
    this.logger.log(`Sent approval notifications to ${uniqueTargets.length} users`);
  }
}
