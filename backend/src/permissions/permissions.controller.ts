import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from './permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

@Controller('api/permissions')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('user:view:all')
  getAllPermissions() {
    return this.permissionsService.getAllPermissions();
  }

  @Get('roles')
  @RequirePermissions('user:view:all')
  getRolePermissions() {
    return this.permissionsService.getRolePermissions();
  }

  @Get('my')
  getMyPermissions(@Req() req) {
    return {
      role: req.user.role,
      permissions: this.permissionsService.getUserPermissions(req.user.role),
    };
  }
}
