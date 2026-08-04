import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, IsActiveMatchOptions } from '@angular/router';
import { HasRightDirective } from '../../shared/data-access/has-right.directive';
import { PermissionService } from '../../shared/data-access/permission.service';
import { ActiveRoleService } from '../../shared/data-access/active-role.service';
import { ROLE_LABELS } from '../../shared/data-access/user-role.types';
import { RoleMenuConfigService, RoleMenuEntry } from '../../shared/data-access/role-menu-config.service';
import { SIDEBAR_ICON_PATHS, SidebarIconName } from '../../shared/data-access/sidebar-icons';

@Component({
  selector: 'mc-app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, HasRightDirective],
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
  protected readonly contextualMenu = computed(() => {
    const items = this.menuConfig.getContextualItems(this.activeRole.currentRole());
    return items.filter(item => this.permissions.hasRight(item.requiredRight));
  });

  private readonly QP_EXACT: IsActiveMatchOptions = {
    paths: 'subset', queryParams: 'exact', matrixParams: 'ignored', fragment: 'ignored',
  };
  private readonly QP_IGNORE: IsActiveMatchOptions = {
    paths: 'subset', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored',
  };

  protected linkActiveOptions(item: RoleMenuEntry): IsActiveMatchOptions {
    return item.queryParams ? this.QP_EXACT : this.QP_IGNORE;
  }

  protected iconPath(name: SidebarIconName): string {
    return SIDEBAR_ICON_PATHS[name];
  }
}
