export type UserRole = 'AGENT' | 'SUPERVISOR' | 'MANAGER' | 'ADMIN';

export const ROLE_LABELS: Record<UserRole, string> = {
  AGENT:      'Agent',
  SUPERVISOR: 'Superviseur',
  MANAGER:    'Manager',
  ADMIN:      'Administrateur',
};

/** User identity attached to the currently active role. */
export interface ActiveRoleUser {
  readonly name: string;
  readonly avatarInitials: string;
}

/**
 * Typed entry for any role-scoped navigation menu (primary sidebar, secondary
 * supervision panel, etc.).  `requiredRight` is a PermissionCode string; when
 * omitted the item is always visible.
 */
export interface RoleMenuItem {
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly requiredRight?: string;
}
