import { Injectable, Signal } from '@angular/core';
import { PermissionCode, RoleProfile } from './permission.types';

@Injectable()
export abstract class PermissionService {
  abstract readonly currentProfile: Signal<RoleProfile>;

  abstract hasRight(code: PermissionCode): boolean;

  // No-op in production; MockPermissionService overrides this.
  setProfile(_profile: RoleProfile): void {}
}
