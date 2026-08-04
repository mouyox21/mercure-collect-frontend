import { Component, computed, input, output } from '@angular/core';
import { CaseData, CaseVariant } from '../ui.types';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'mc-case-card',
  standalone: true,
  imports: [StatusBadgeComponent],
  templateUrl: './case-card.component.html',
  styleUrl: './case-card.component.scss',
})
export class CaseCardComponent {
  readonly case = input.required<CaseData>();
  readonly variant = input<CaseVariant>('standard');

  readonly selected = output<CaseData>();

  protected readonly cardClass = computed<string>(() => `case-card case-card--${this.variant()}`);

  protected readonly formattedAmount = computed<string>(() =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(this.case().amount)
  );

  protected readonly formattedLastContact = computed<string>(() => {
    const d = this.case().lastContact;
    if (!d) return '—';
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  });

  protected readonly overdueLabel = computed<string>(() => {
    const days = this.case().daysOverdue;
    return `${days} jour${days > 1 ? 's' : ''} de retard`;
  });

  protected readonly ariaLabel = computed<string>(() =>
    `Dossier ${this.case().debtorName}, ${this.formattedAmount()}, ${this.overdueLabel()}, statut ${this.case().status}`
  );

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selected.emit(this.case());
    }
  }
}
