import { Injectable, signal } from '@angular/core';
import { PermissionService } from '../permission.service';
import { PermissionCode, RoleProfile, ROLE_PERMISSIONS } from '../permission.types';

@Injectable()
export class MockPermissionService extends PermissionService {
  readonly currentProfile = signal<RoleProfile>('agent');

  hasRight(code: PermissionCode): boolean {
    return ROLE_PERMISSIONS[this.currentProfile()].has(code);
  }

  override setProfile(profile: RoleProfile): void {
    this.currentProfile.set(profile);
  }
}
