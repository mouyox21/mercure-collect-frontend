import { Injectable } from '@angular/core';
import { UserRole, ROLE_LABELS, RoleMenuItem } from './user-role.types';
import { PermissionCode } from './permission.types';
import { SidebarIconName } from './sidebar-icons';

export interface RoleMenuEntry extends RoleMenuItem {
  readonly icon: SidebarIconName;
  readonly requiredRight: PermissionCode;
  readonly queryParams?: Record<string, string>;
}

export const ROLE_SECTION_TITLES: Record<UserRole, string> = {
  AGENT:      'Espace Agent',
  SUPERVISOR: 'Espace Superviseur',
  MANAGER:    'Espace Manager',
  ADMIN:      'Administration',
};

/** Default landing route when switching to a given role. */
export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  AGENT:      '/dashboard',
  SUPERVISOR: '/superviseur/dashboard',
  MANAGER:    '/superviseur/dashboard',
  ADMIN:      '/parametrages',
};

const MENU_CONFIG: Record<UserRole, RoleMenuEntry[]> = {
  // AGENT : toute la navigation est dans la nav commune (Dashboard / Dossiers / Clients).
  // Aucun item contextuel spécifique → bloc "Espace Agent" masqué dans l'AppSidebar.
  AGENT: [],
  SUPERVISOR: [
    { label: 'Vue superviseur', icon: 'chart-bar',            route: '/superviseur/dashboard', requiredRight: 'CASE_ASSIGN' },
    { label: 'Équipe',          icon: 'users',                route: '/superviseur/equipe',    requiredRight: 'CASE_ASSIGN' },
    { label: 'Escalades',       icon: 'exclamation-triangle', route: '/superviseur/escalades', requiredRight: 'ESCALATION_CREATE' },
    { label: 'Contentieux',     icon: 'scale',                route: '/contentieux',           requiredRight: 'LEGAL_CASE_VIEW' },
    { label: 'Supervision IA',  icon: 'cpu-chip',             route: '/superviseur/ia-dmn',    requiredRight: 'CASE_ASSIGN' },
  ],
  MANAGER: [
    { label: 'Vue manager',   icon: 'trending-up',    route: '/superviseur/dashboard',     requiredRight: 'CASE_ASSIGN' },
    { label: 'Portefeuilles', icon: 'briefcase',      route: '/superviseur/portefeuilles', requiredRight: 'CASE_ASSIGN' },
    { label: 'Performance',   icon: 'trophy',         route: '/rapports', queryParams: { vue: 'performance' }, requiredRight: 'REPORT_EXPORT' },
    { label: 'Décisions',     icon: 'check-circle',   route: '/superviseur/escalades',                        requiredRight: 'ESCALATION_CREATE' },
    { label: 'Reporting',     icon: 'clipboard-list', route: '/rapports', queryParams: { vue: 'reporting'  },  requiredRight: 'REPORT_EXPORT' },
  ],
  ADMIN: [
    { label: 'Paramétrage',        icon: 'cog',               route: '/parametrages',                 requiredRight: 'SETTINGS_MANAGE' },
    { label: 'Référentiels',       icon: 'book-open',          route: '/parametrages/referentiels',    requiredRight: 'SETTINGS_MANAGE' },
    { label: 'Règles & Workflows', icon: 'arrows-right-left',  route: '/parametrages/regles-workflows', requiredRight: 'SETTINGS_MANAGE' },
    { label: 'Imports',            icon: 'arrow-down-tray',    route: '/parametrages/imports',          requiredRight: 'SETTINGS_MANAGE' },
    { label: 'Audit',              icon: 'shield-check',       route: '/parametrages/audit',            requiredRight: 'AUDIT_VIEW' },
  ],
};

@Injectable({ providedIn: 'root' })
export class RoleMenuConfigService {
  getSectionTitle(role: UserRole): string {
    return ROLE_SECTION_TITLES[role];
  }

  getContextualItems(role: UserRole): RoleMenuEntry[] {
    return MENU_CONFIG[role];
  }

  getRoleLabel(role: UserRole): string {
    return ROLE_LABELS[role];
  }
}
