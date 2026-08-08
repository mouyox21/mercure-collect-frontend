import { Component, input } from '@angular/core';

/** Small pill showing an item count next to a nav entry or list header (e.g. "5"). */
@Component({
  selector: 'mc-count-badge',
  standalone: true,
  templateUrl: './count-badge.component.html',
  styleUrl: './count-badge.component.scss',
})
export class CountBadgeComponent {
  readonly count = input.required<number>();
}
