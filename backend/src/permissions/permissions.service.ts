import { Injectable } from '@nestjs/common';
import { ROLE_PERMISSIONS, PERMISSIONS } from './permissions.constants';

@Injectable()
export class PermissionsService {
  getUserPermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.responder || [];
  }

  hasPermission(role: string, permission: string): boolean {
    const permissions = this.getUserPermissions(role);
    return permissions.includes(permission);
  }

  getAllPermissions(): object {
    return PERMISSIONS;
  }

  getRolePermissions(): object {
    return ROLE_PERMISSIONS;
  }
}
