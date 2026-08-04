import { Component, computed, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActiveRoleService } from '../../shared/data-access/active-role.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { PermissionCode } from '../../shared/data-access/permission.types';
import { ROLE_LABELS, UserRole } from '../../shared/data-access/user-role.types';
import { ROLE_DEFAULT_ROUTES } from '../../shared/data-access/role-menu-config.service';
import { CreditorService } from '../../shared/data-access/creditor.service';
import { NotificationService } from '../../shared/data-access/notification.service';
import { NotificationCenterComponent } from '../notification-center/notification-center.component';

/** URL prefixes that require a specific right — used to detect cross-role navigation conflicts. */
const PROTECTED_PREFIXES: Array<{ prefix: string; right: PermissionCode }> = [
  { prefix: '/superviseur', right: 'CASE_ASSIGN' },
  { prefix: '/contentieux', right: 'LEGAL_CASE_VIEW' },
  { prefix: '/rapports',    right: 'REPORT_EXPORT' },
  { prefix: '/parametrages', right: 'SETTINGS_MANAGE' },
];

@Component({
  selector: 'mc-app-header',
  standalone: true,
  imports: [NotificationCenterComponent],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  /** Emitted when the burger button is clicked (mobile/tablet only). */
  readonly toggleSidebar = output<void>();

  protected readonly creditors  = inject(CreditorService);
  protected readonly notifs     = inject(NotificationService);
  private   readonly activeRole = inject(ActiveRoleService);
  private   readonly permissions = inject(PermissionService);
  private   readonly router     = inject(Router);

  protected readonly user           = this.activeRole.currentUser;
  protected readonly currentRole    = this.activeRole.currentRole;
  protected readonly availableRoles = this.activeRole.availableRoles;
  protected readonly roleLabel      = computed(() => ROLE_LABELS[this.activeRole.currentRole()]);

  protected readonly today = computed(() =>
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      year:    'numeric',
    }),
  );

  protected readonly searchQuery  = signal('');
  protected readonly creditorOpen = signal(false);
  protected readonly notifOpen    = signal(false);

  protected readonly badgeLabel = computed(() => {
    const n = this.notifs.unreadCount();
    return n > 9 ? '9+' : String(n);
  });

  protected roleLabelOf(role: UserRole): string {
    return ROLE_LABELS[role];
  }

  protected onRoleChange(role: UserRole): void {
    this.activeRole.setRole(role);
    // Redirect to the role's default route if the current page is no longer accessible.
    const currentUrl = this.router.url;
    const blocked = PROTECTED_PREFIXES.some(
      ({ prefix, right }) =>
        currentUrl.startsWith(prefix) && !this.permissions.hasRight(right),
    );
    if (blocked) {
      void this.router.navigateByUrl(ROLE_DEFAULT_ROUTES[role]);
    }
  }

  protected toggleCreditor(): void {
    this.creditorOpen.update(v => !v);
    if (this.creditorOpen()) this.notifOpen.set(false);
  }

  protected selectCreditor(id: string): void {
    this.creditors.select(id);
    this.creditorOpen.set(false);
  }

  protected toggleNotifications(): void {
    this.notifOpen.update(v => !v);
    if (this.notifOpen()) this.creditorOpen.set(false);
  }
}
