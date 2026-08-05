import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ActiveRoleService } from '../active-role.service';
import { ActiveRoleUser, UserRole } from '../user-role.types';
import { PermissionService } from '../permission.service';
import { RoleProfile } from '../permission.types';

/** Maps the new UserRole to the legacy RoleProfile expected by PermissionService / HasRightDirective. */
const ROLE_TO_PROFILE: Record<UserRole, RoleProfile> = {
  AGENT:      'agent',
  SUPERVISOR: 'superviseur',
  MANAGER:    'manager',
  ADMIN:      'administrateur',
};

const MOCK_USERS: Record<UserRole, ActiveRoleUser> = {
  AGENT:      { name: 'Marie Dupont',  avatarInitials: 'MD' },
  SUPERVISOR: { name: 'Jean Martin',   avatarInitials: 'JM' },
  MANAGER:    { name: 'Isabelle Roux', avatarInitials: 'IR' },
  ADMIN:      { name: 'Admin Système', avatarInitials: 'AS' },
};

@Injectable()
export class MockActiveRoleService extends ActiveRoleService {
  private readonly permissions = inject(PermissionService);

  private readonly _role = signal<UserRole>('AGENT');

  readonly currentRole: Signal<UserRole> = this._role.asReadonly();

  readonly currentUser: Signal<ActiveRoleUser> = computed(
    () => MOCK_USERS[this._role()],
  );

  /** Full preview: all four roles are available in mock mode. */
  readonly availableRoles: readonly UserRole[] = ['AGENT', 'SUPERVISOR', 'MANAGER', 'ADMIN'];

  setRole(role: UserRole): void {
    this._role.set(role);
    // Keep legacy PermissionService (used by HasRightDirective) in sync.
    this.permissions.setProfile(ROLE_TO_PROFILE[role]);
  }
}
