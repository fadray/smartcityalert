import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from '../incidents/incident.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { IncidentsService } from '../incidents/incidents.service';
import { DepartmentsService } from '../departments/departments.service';
import { Department } from '../departments/department.entity'; // ✅ Add this import

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
    private usersService: UsersService,
    private incidentsService: IncidentsService,
    private departmentsService: DepartmentsService,
  ) {}

  async createIncidentFromPublic(data: {
    title: string;
    description: string;
    incident_type: string;
    severity_level?: number;
    location?: string;
    phone?: string;
    email?: string;
    name?: string;
    latitude?: number;
    longitude?: number;
    images?: string[];
  }) {
    this.logger.log(`Creating public incident: ${data.title}`);

    // Find or create user (same as WhatsApp)
    let userId: string | undefined = undefined;
    if (data.phone) {
      try {
        let user = await this.usersService.findByPhone(data.phone);
        if (!user) {
          user = await this.usersService.createFromWhatsApp({
            phone: data.phone,
            name: data.name || 'Public Reporter',
            role: 'resident',
          });
        }
        userId = user.id;
        this.logger.log(`User found/created: ${user.id}`);
      } catch (error) {
        this.logger.warn(`Could not create/find user from phone: ${error.message}`);
      }
    }

    // ✅ Same department mapping as WhatsApp
    let department: Department | null = null;
    const departmentMap: Record<string, string> = {
      fire: 'Fire Service',
      medical: 'Health Services',
      security: 'Security',
      infrastructure: 'Maintenance',
      traffic: 'Traffic Management',
      flooding: 'Drainage Services',
      general: 'Fire Service', // Default
    };

    const departmentName = departmentMap[data.incident_type] || 'Fire Service';
    if (departmentName) {
      department = await this.departmentsService.findByName(departmentName);
      if (department) {
        this.logger.log(`Department found: ${department.name}`);
      } else {
        this.logger.log(`No department found for: ${departmentName}`);
      }
    }

    // ✅ Use the same pattern as WhatsApp: department?.id || null
    const incident = await this.incidentsService.create(
      {
        title: data.title,
        description: data.description,
        incident_type: data.incident_type || 'general',
        severity_level: data.severity_level || 1,
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        location: data.location || '',
        department_id: department?.id || null,  // ✅ Same as WhatsApp!
      },
      userId || '',
      data.images || []
    );

    this.logger.log(`Public incident created: ${incident.id}`);
    return incident;
  }

  /**
   * Get public incident data (safe for public viewing)
   */
  async getPublicIncident(id: string) {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: {
        department: true,
        reported_by: true,
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    // Parse images from JSON string if it exists
    let images: string[] = [];
    if (incident.images) {
      try {
        images = typeof incident.images === 'string' 
          ? JSON.parse(incident.images) 
          : incident.images;
        if (!Array.isArray(images)) {
          images = [];
        }
      } catch (e) {
        this.logger.warn(`Could not parse images for incident ${id}`);
        images = [];
      }
    }

    return {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      incident_type: incident.incident_type,
      severity_level: incident.severity_level,
      status: incident.status,
      created_at: incident.created_at,
      updated_at: incident.updated_at,
      location: (incident as any).location || null,
      images: images,
      department: incident.department ? {
        id: incident.department.id,
        name: incident.department.name,
      } : null,
    };
  }

  /**
   * Get recent public incidents
   */
  async getRecentIncidents(limit: number = 10) {
    const incidents = await this.incidentRepository.find({
      order: { created_at: 'DESC' },
      take: Math.min(limit, 20),
      select: ['id', 'title', 'incident_type', 'status', 'severity_level', 'created_at'] as any,
      relations: {
        department: true,
      },
    });

    return incidents.map(incident => ({
      id: incident.id,
      title: incident.title,
      incident_type: incident.incident_type,
      status: incident.status,
      severity_level: incident.severity_level,
      created_at: incident.created_at,
      department: incident.department ? {
        id: incident.department.id,
        name: incident.department.name,
      } : null,
    }));
  }
}
