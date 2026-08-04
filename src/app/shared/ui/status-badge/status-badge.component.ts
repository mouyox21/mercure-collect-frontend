import { Component, computed, input } from '@angular/core';
import { StatusValue } from '../ui.types';

const STATUS_META: Record<StatusValue, { label: string; modifier: string }> = {
  'nouveau':        { label: 'Nouveau',         modifier: 'nouveau' },
  'en-cours':       { label: 'En cours',        modifier: 'en-cours' },
  'promesse':       { label: 'Promesse',         modifier: 'promesse' },
  'echeancier':     { label: 'Échéancier',       modifier: 'echeancier' },
  'precontentieux': { label: 'Pré-contentieux',  modifier: 'precontentieux' },
  'contentieux':    { label: 'Contentieux',      modifier: 'contentieux' },
  'cloture':        { label: 'Clôturé',          modifier: 'cloture' },
};

@Component({
  selector: 'mc-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly status = input.required<StatusValue>();

  protected readonly meta = computed(() => STATUS_META[this.status()]);
  protected readonly badgeClass = computed(() => `status-badge status-badge--${this.meta().modifier}`);
}
