import { Component, computed, input } from '@angular/core';
import { IconName, ICON_PATHS } from '../../data-access/icon-registry';

export type { IconName };

/** Single monochrome vector icon (Heroicons v2 outline, 24 × 24 viewBox). */
@Component({
  selector: 'mc-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  readonly name = input.required<IconName>();

  protected readonly path = computed(() => ICON_PATHS[this.name()]);
}
