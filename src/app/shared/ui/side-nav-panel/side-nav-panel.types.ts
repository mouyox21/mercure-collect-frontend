import { IconName } from '../icon/icon.component';

/**
 * One entry in a `SideNavPanelComponent` list.
 *
 * Two mutually exclusive usage modes:
 * - **Router mode** — `route` is set: renders an `<a [routerLink]>`, active state driven by
 *   Angular's router (`exactMatch` / `queryParams` refine the match, mirroring
 *   `IsActiveMatchOptions`).
 * - **Local mode** — `route` is omitted: renders a clickable item whose active state is driven
 *   by the panel's `activeKey` input, and selection is reported via `(itemSelected)`.
 */
export interface SideNavItem {
  readonly key: string;
  readonly label: string;
  readonly icon: IconName;
  readonly badge?: number;
  readonly route?: string;
  readonly queryParams?: Record<string, string>;
  readonly exactMatch?: boolean;
}
