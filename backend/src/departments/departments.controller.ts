import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  create(@Body() createDeptDto: any) {
    return this.departmentsService.create(createDeptDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDeptDto: any) {
    return this.departmentsService.update(id, updateDeptDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.departmentsService.delete(id);
  }
}
