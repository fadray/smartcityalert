import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/departments')
@UseGuards(AuthGuard('jwt'))
export class DepartmentsController {
  constructor(private departmentsService: DepartmentsService) {}

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Post()
  create(@Body() createDeptDto: any) {
    return this.departmentsService.create(createDeptDto);
  }
}
