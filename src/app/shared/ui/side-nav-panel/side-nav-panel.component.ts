import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive, IsActiveMatchOptions } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { CountBadgeComponent } from '../count-badge/count-badge.component';
import { SideNavItem } from './side-nav-panel.types';

export type { SideNavItem };

const QP_EXACT: IsActiveMatchOptions = {
  paths: 'subset', queryParams: 'exact', matrixParams: 'ignored', fragment: 'ignored',
};
const QP_IGNORE: IsActiveMatchOptions = {
  paths: 'subset', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored',
};
const PATH_EXACT: IsActiveMatchOptions = {
  paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored',
};

/**
 * Secondary navigation panel: a titled list of icon + label (+ optional count badge) items.
 * Shared by the sidebar's role-contextual block, and by screens with a domain/package
 * switcher panel (Référentiels, Règles & Workflows) — see docs/qa-navigation-audit.md #11.
 *
 * Items with a `route` navigate via the Router (active state from `routerLinkActive`);
 * items without one are local toggles (active state from `activeKey`, selection via
 * `(itemSelected)`).
 */
@Component({
  selector: 'mc-side-nav-panel',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, CountBadgeComponent],
  templateUrl: './side-nav-panel.component.html',
  styleUrl: './side-nav-panel.component.scss',
})
export class SideNavPanelComponent {
  /** Panel heading (small-caps). Omit for an untitled panel stacked under another one. */
  readonly title = input<string | undefined>(undefined);
  readonly items = input.required<readonly SideNavItem[]>();
  /** Key of the active item — only relevant for local-mode (non-route) items. */
  readonly activeKey = input<string | null>(null);
  /** Dark variant for use inside the navy AppSidebar; light (default) for content-panel usage. */
  readonly variant = input<'light' | 'dark'>('light');

  readonly itemSelected = output<string>();

  protected linkActiveOptions(item: SideNavItem): IsActiveMatchOptions {
    if (item.exactMatch) return PATH_EXACT;
    return item.queryParams ? QP_EXACT : QP_IGNORE;
  }

  protected select(key: string): void {
    this.itemSelected.emit(key);
  }
}
