import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
  ) {}

  async findAll(): Promise<Department[]> {
    return this.departmentRepository.find({ where: { is_active: true } });
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({ where: { id } });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    return department;
  }

  async create(createDeptDto: any): Promise<Department> {
    const result = await this.departmentRepository.insert(createDeptDto);
    const id = result.identifiers[0].id;
    return this.findOne(id);
  }

  async update(id: string, updateDeptDto: any): Promise<Department> {
    await this.departmentRepository.update(id, updateDeptDto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.departmentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Department not found');
    }
    return { message: 'Department deleted successfully' };
  }

  // ✅ CORRECTED findByName - without relations (matching your entity)
  async findByName(name: string): Promise<Department | null> {
    const department = await this.departmentRepository.findOne({ 
      where: { name: name }
    });
    return department || null;
  }

  async findByCode(code: string): Promise<Department | null> {
    const department = await this.departmentRepository.findOne({ 
      where: { code: code }
    });
    return department || null;
  }
}