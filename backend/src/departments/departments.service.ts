import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepo: Repository<Department>,
  ) {}

  async findAll(): Promise<Department[]> {
    return await this.departmentRepo.find();
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async create(data: Partial<Department>): Promise<Department> {
    const department = this.departmentRepo.create(data);
    return await this.departmentRepo.save(department);
  }

  async update(id: string, data: Partial<Department>): Promise<Department> {
    await this.departmentRepo.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.departmentRepo.delete(id);
  }
}
