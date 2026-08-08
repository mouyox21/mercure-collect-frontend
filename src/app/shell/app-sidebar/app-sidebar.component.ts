import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HasRightDirective } from '../../shared/data-access/has-right.directive';
import { PermissionService } from '../../shared/data-access/permission.service';
import { ActiveRoleService } from '../../shared/data-access/active-role.service';
import { ROLE_LABELS } from '../../shared/data-access/user-role.types';
import { RoleMenuConfigService } from '../../shared/data-access/role-menu-config.service';
import { IconComponent, SideNavPanelComponent, SideNavItem } from '../../shared/ui';

@Component({
  selector: 'mc-app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, HasRightDirective, IconComponent, SideNavPanelComponent],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.scss',
})
export class AppSidebarComponent {
  private readonly activeRole   = inject(ActiveRoleService);
  private readonly permissions  = inject(PermissionService);
  private readonly menuConfig   = inject(RoleMenuConfigService);

  protected readonly user         = this.activeRole.currentUser;
  protected readonly roleLabel    = computed(() => ROLE_LABELS[this.activeRole.currentRole()]);
  protected readonly sectionTitle = computed(() =>
    this.menuConfig.getSectionTitle(this.activeRole.currentRole()),
  );

  /** Contextual items for the active role, filtered by the user's current rights. */
  protected readonly contextualMenu = computed<SideNavItem[]>(() => {
    const items = this.menuConfig.getContextualItems(this.activeRole.currentRole());
    return items
      .filter(item => this.permissions.hasRight(item.requiredRight))
      .map(item => ({
        key:         item.route,
        label:       item.label,
        icon:        item.icon,
        route:       item.route,
        queryParams: item.queryParams,
        exactMatch:  item.exactMatch,
      }));
  });
}
