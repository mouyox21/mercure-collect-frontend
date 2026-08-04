import { Component, computed, input } from '@angular/core';
import { KpiVariant } from '../ui.types';

@Component({
  selector: 'mc-kpi-card',
  standalone: true,
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly variant = input<KpiVariant>('standard');
  readonly delta = input<number | undefined>(undefined);
  readonly unit = input<string | undefined>(undefined);
  readonly subtitle = input<string | undefined>(undefined);

  protected readonly displayValue = computed<string>(() => {
    const v = this.value();
    const u = this.unit();
    if (this.variant() === 'amount' && typeof v === 'number') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
    }
    return u ? `${v} ${u}` : `${v}`;
  });

  protected readonly deltaClass = computed<string>(() => {
    const d = this.delta();
    if (d === undefined) return '';
    if (d > 0) return 'kpi-card__delta--positive';
    if (d < 0) return 'kpi-card__delta--negative';
    return 'kpi-card__delta--neutral';
  });

  protected readonly cardClass = computed<string>(() => `kpi-card kpi-card--${this.variant()}`);

  protected readonly ariaLabel = computed<string>(() => `${this.title()} : ${this.displayValue()}`);
}
