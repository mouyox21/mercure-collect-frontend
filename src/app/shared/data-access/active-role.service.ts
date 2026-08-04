import { Injectable, Signal } from '@angular/core';
import { ActiveRoleUser, UserRole } from './user-role.types';

/**
 * Single source of truth for the active role and user identity.
 *
 * Mock mode  — all roles are previewable; setRole() switches freely.
 * API mode   — currentRole and availableRoles derive from the authenticated
 *              user's backend profile; setRole() is a no-op unless the user
 *              holds multiple roles.
 */
@Injectable()
export abstract class ActiveRoleService {
  /** The currently active role. */
  abstract readonly currentRole: Signal<UserRole>;

  /** Display identity (name, avatar) for the active role. */
  abstract readonly currentUser: Signal<ActiveRoleUser>;

  /**
   * Roles the logged-in user is allowed to preview.
   * Mock: all four roles.  API: populated from the backend user profile.
   */
  abstract readonly availableRoles: readonly UserRole[];

  /** Switch the active role (preview mode in mock; restricted in api). */
  abstract setRole(role: UserRole): void;
}
