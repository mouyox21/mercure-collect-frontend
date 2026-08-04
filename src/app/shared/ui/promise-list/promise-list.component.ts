import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { PaymentService } from '../../data-access/payment.service';
import { PaymentPromiseDto, CreatePromiseCommand } from '../../data-access/models/payment.model';
import { CaseContextDto, TimelineEvent, ViewState } from '../ui.types';
import { PromiseModalComponent } from '../promise-modal/promise-modal.component';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { ErrorStateComponent } from '../error-state/error-state.component';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:    'Active',
  KEPT:      'Tenue',
  BROKEN:    'Rompue',
  CANCELLED: 'Annulée',
};

const CHANNEL_LABELS: Record<string, string> = {
  PHONE_CALL: 'Appel',
  SMS:        'SMS',
  EMAIL:      'E-mail',
  VISIT:      'Visite',
};

@Component({
  selector: 'mc-promise-list',
  standalone: true,
  imports: [
    PromiseModalComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './promise-list.component.html',
  styleUrl: './promise-list.component.scss',
})
export class PromiseListComponent implements OnInit {
  readonly caseContext = input.required<CaseContextDto>();

  readonly promiseCreated = output<TimelineEvent>();

  private readonly paymentSvc = inject(PaymentService);

  readonly viewState = signal<ViewState>('loading');
  readonly promises  = signal<PaymentPromiseDto[]>([]);
  readonly modalOpen = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.paymentSvc.getPromises(this.caseContext().caseId).subscribe({
      next: (page) => {
        this.promises.set(page.items);
        this.viewState.set(page.items.length === 0 ? 'empty' : 'success');
      },
      error: () => this.viewState.set('error'),
    });
  }

  onPromiseSubmitted(cmd: CreatePromiseCommand): void {
    this.modalOpen.set(false);
    this.paymentSvc.createPromise(cmd).subscribe({
      next: (p) => {
        this.promises.update(list =>
          [...list, p].sort((a, b) => a.promiseDate.localeCompare(b.promiseDate))
        );
        this.viewState.set('success');
        this.promiseCreated.emit(this.buildTimelineEntry(p));
      },
    });
  }

  private buildTimelineEntry(p: PaymentPromiseDto): TimelineEvent {
    const currency = p.currency ?? 'MAD';
    const amountFmt = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(p.promiseAmount);
    return {
      id:          `prom-${Date.now()}`,
      date:        new Date(p.promiseDate + 'T00:00:00'),
      channel:     'telephone',
      type:        'promesse',
      description: `Promesse de paiement — ${amountFmt} ${currency} prévue le ${this.formatDate(p.promiseDate)}.`,
      amount:      p.promiseAmount,
    };
  }

  protected statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  protected channelLabel(channel: string | undefined): string {
    return channel ? (CHANNEL_LABELS[channel] ?? channel) : '—';
  }

  protected formatAmount(amount: number, currency = 'MAD'): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(amount) + ' ' + currency;
  }

  protected formatDate(isoDate: string): string {
    return new Date(isoDate + 'T00:00:00').toLocaleDateString('fr-FR', {
      day:   '2-digit',
      month: '2-digit',
      year:  'numeric',
    });
  }

  protected activeCount(): number {
    return this.promises().filter(p => p.status === 'ACTIVE').length;
  }

  protected brokenCount(): number {
    return this.promises().filter(p => p.status === 'BROKEN').length;
  }
}
