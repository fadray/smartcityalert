import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { MaintenanceRequest, MaintenanceStatus, Priority } from './maintenance.entity';
import { Asset } from './maintenance.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRequest)
    private maintenanceRepo: Repository<MaintenanceRequest>,
    @InjectRepository(Asset)
    private assetRepo: Repository<Asset>,
  ) {}

  async createRequest(data: any, userId: string): Promise<MaintenanceRequest> {
    const result = await this.maintenanceRepo.insert({
      ...data,
      reported_by_id: userId,
      status: MaintenanceStatus.PENDING,
    });
    const id = result.identifiers[0].id;
    return this.getRequestById(id);
  }

  async getAllRequests(filters?: any): Promise<MaintenanceRequest[]> {
    const query = this.maintenanceRepo.createQueryBuilder('request')
      .leftJoinAndSelect('request.department', 'department')
      .leftJoinAndSelect('request.reported_by', 'reported_by')
      .leftJoinAndSelect('request.assigned_to', 'assigned_to')
      .orderBy('request.created_at', 'DESC');

    if (filters?.status) {
      query.andWhere('request.status = :status', { status: filters.status });
    }
    if (filters?.priority) {
      query.andWhere('request.priority = :priority', { priority: filters.priority });
    }
    if (filters?.department_id) {
      query.andWhere('request.department_id = :department_id', { department_id: filters.department_id });
    }

    return query.getMany();
  }

  async getRequestById(id: string): Promise<MaintenanceRequest> {
    const request = await this.maintenanceRepo.findOne({
      where: { id },
      relations: {
        department: true,
        reported_by: true,
        assigned_to: true,
      },
    });
    if (!request) throw new NotFoundException('Maintenance request not found');
    return request;
  }

  async updateRequest(id: string, data: any): Promise<MaintenanceRequest> {
    await this.maintenanceRepo.update(id, data);
    return this.getRequestById(id);
  }

  async assignTechnician(id: string, technicianId: string): Promise<MaintenanceRequest> {
    await this.maintenanceRepo.update(id, {
      assigned_to_id: technicianId,
      status: MaintenanceStatus.ASSIGNED,
    });
    return this.getRequestById(id);
  }

  async startWork(id: string): Promise<MaintenanceRequest> {
    await this.maintenanceRepo.update(id, { status: MaintenanceStatus.IN_PROGRESS });
    return this.getRequestById(id);
  }

  async completeWork(id: string, data: any): Promise<MaintenanceRequest> {
    await this.maintenanceRepo.update(id, {
      status: MaintenanceStatus.COMPLETED,
      completion_date: new Date(),
      technician_notes: data.notes,
      parts_used: data.parts_used,
      actual_cost: data.actual_cost,
    });
    return this.getRequestById(id);
  }

  async verifyCompletion(id: string, notes: string): Promise<MaintenanceRequest> {
    await this.maintenanceRepo.update(id, {
      status: MaintenanceStatus.VERIFIED,
      verification_notes: notes,
    });
    return this.getRequestById(id);
  }

  async getStats(): Promise<any> {
    const pending = await this.maintenanceRepo.count({ where: { status: MaintenanceStatus.PENDING } });
    const inProgress = await this.maintenanceRepo.count({ where: { status: MaintenanceStatus.IN_PROGRESS } });
    const completed = await this.maintenanceRepo.count({ where: { status: MaintenanceStatus.COMPLETED } });
    const verified = await this.maintenanceRepo.count({ where: { status: MaintenanceStatus.VERIFIED } });
    const overdue = await this.maintenanceRepo.count({
      where: {
        scheduled_date: LessThan(new Date()),
        status: MaintenanceStatus.PENDING,
      },
    });

    return { pending, inProgress, completed, verified, overdue };
  }

  // Asset Management
  async createAsset(data: any): Promise<Asset> {
    const result = await this.assetRepo.insert(data);
    const id = result.identifiers[0].id;
    return this.getAssetById(id);
  }

  async getAllAssets(): Promise<Asset[]> {
    return this.assetRepo.find({ order: { created_at: 'DESC' } });
  }

  async getAssetById(id: string): Promise<Asset> {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async updateAsset(id: string, data: any): Promise<Asset> {
    await this.assetRepo.update(id, data);
    return this.getAssetById(id);
  }

  async scheduleMaintenance(id: string, date: Date): Promise<Asset> {
    await this.assetRepo.update(id, { next_maintenance_date: date });
    return this.getAssetById(id);
  }

  async getMaintenanceReport(startDate: Date, endDate: Date): Promise<any> {
    const requests = await this.maintenanceRepo.find({
      where: { created_at: Between(startDate, endDate) },
      relations: {
        department: true,
      },
    });

    const byStatus = {
      pending: requests.filter(r => r.status === MaintenanceStatus.PENDING).length,
      completed: requests.filter(r => r.status === MaintenanceStatus.COMPLETED).length,
      verified: requests.filter(r => r.status === MaintenanceStatus.VERIFIED).length,
    };

    const totalCost = requests.reduce((sum, r) => sum + (r.actual_cost || 0), 0);
    const avgCompletionTime = requests
      .filter(r => r.completion_date && r.created_at)
      .reduce((sum, r) => {
        const days = (new Date(r.completion_date).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0) / (requests.filter(r => r.completion_date).length || 1);

    const byDepartment: Record<string, number> = {};
    requests.forEach(r => {
      const deptName = r.department?.name || 'Unknown';
      byDepartment[deptName] = (byDepartment[deptName] || 0) + 1;
    });

    return {
      total_requests: requests.length,
      by_status: byStatus,
      total_cost: totalCost,
      avg_completion_days: avgCompletionTime.toFixed(1),
      by_department: byDepartment,
    };
  }
}
