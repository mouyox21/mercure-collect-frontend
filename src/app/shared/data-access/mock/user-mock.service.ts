import { Injectable, computed, inject } from '@angular/core';
import { CurrentUser, UserService } from '../user.service';
import { PermissionService } from '../permission.service';
import { RoleProfile } from '../permission.types';

const MOCK_USERS: Record<RoleProfile, CurrentUser> = {
  agent:          { name: 'Marie Dupont',   initials: 'MD' },
  superviseur:    { name: 'Jean Martin',    initials: 'JM' },
  administrateur: { name: 'Admin Système',  initials: 'AS' },
};

@Injectable()
export class MockUserService extends UserService {
  private readonly permissions = inject(PermissionService);

  readonly currentUser = computed<CurrentUser>(
    () => MOCK_USERS[this.permissions.currentProfile()] ?? MOCK_USERS.agent,
  );
}
