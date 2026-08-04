import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionCaseService } from '../../shared/data-access/collection-case.service';
import { PaymentService } from '../../shared/data-access/payment.service';
import { CollectionCaseDetailDto } from '../../shared/data-access/models/collection-case.model';
import {
  PaymentInstallmentDto,
  PaymentPlanCommand,
  PaymentPlanFrequency,
} from '../../shared/data-access/models/payment.model';
import { ViewState } from '../../shared/ui/ui.types';
import {
  ErrorStateComponent,
  ForbiddenStateComponent,
  SkeletonLoaderComponent,
  SuccessToastComponent,
} from '../../shared/ui';

const VALIDATION_AMOUNT_THRESHOLD = 500_000;
const VALIDATION_COUNT_THRESHOLD  = 12;
const DMN_ELIGIBILITY_MIN_SCORE   = 60;

@Component({
  selector: 'mc-payment-schedule',
  standalone: true,
  imports: [
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
    SuccessToastComponent,
  ],
  templateUrl: './payment-schedule.component.html',
  styleUrl: './payment-schedule.component.scss',
})
export class PaymentScheduleComponent implements OnInit {
  private readonly route      = inject(ActivatedRoute);
  private readonly router     = inject(Router);
  private readonly caseSvc    = inject(CollectionCaseService);
  private readonly paymentSvc = inject(PaymentService);

  readonly caseId     = signal('');
  readonly viewState  = signal<ViewState>('loading');
  readonly caseDetail = signal<CollectionCaseDetailDto | null>(null);
  readonly showToast  = signal(false);
  readonly toastMsg   = signal('');
  readonly submitting = signal(false);

  // Simulator fields
  readonly simTotalAmount      = signal(0);
  readonly simDownPayment      = signal(0);
  readonly simInstallmentCount = signal(6);
  readonly simFirstDate        = signal('');
  readonly simFrequency        = signal<PaymentPlanFrequency>('MONTHLY');

  // Generated installments (editable)
  readonly installments = signal<PaymentInstallmentDto[]>([]);
  readonly simulated    = signal(false);

  // Validation block fields
  readonly validationValidator  = signal('');
  readonly validationComment    = signal('');
  readonly validationConditions = signal('');

  readonly dmnEligible = computed(() => {
    const d = this.caseDetail();
    return !!d && d.dmnDecision.score >= DMN_ELIGIBILITY_MIN_SCORE;
  });

  readonly validationRequired = computed(
    () =>
      this.simTotalAmount() > VALIDATION_AMOUNT_THRESHOLD ||
      this.simInstallmentCount() > VALIDATION_COUNT_THRESHOLD,
  );

  readonly simTotal = computed(() =>
    this.installments().reduce((s, i) => s + i.amount, 0),
  );

  readonly canSubmit = computed(() => {
    if (!this.simulated() || this.submitting()) return false;
    if (this.validationRequired()) {
      return (
        this.validationValidator().trim().length > 0 &&
        this.validationComment().trim().length > 0
      );
    }
    return true;
  });

  readonly frequencyOptions: { value: PaymentPlanFrequency; label: string }[] = [
    { value: 'MONTHLY',   label: 'Mensuelle'    },
    { value: 'BIMONTHLY', label: 'Bimestrielle' },
    { value: 'WEEKLY',    label: 'Hebdomadaire' },
  ];

  readonly countOptions = [3, 6, 9, 12, 18, 24];

  readonly validationAmountThreshold = VALIDATION_AMOUNT_THRESHOLD;
  readonly validationCountThreshold  = VALIDATION_COUNT_THRESHOLD;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('caseId') ?? '';
    this.caseId.set(id);
    this.simFirstDate.set(this.nextMonthFirst());
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.caseSvc.getCaseDetail(this.caseId()).subscribe({
      next: (detail) => {
        this.caseDetail.set(detail);
        this.simTotalAmount.set(detail.overdueAmount);
        this.viewState.set('success');
      },
      error: (err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 403) { this.viewState.set('forbidden'); return; }
        this.viewState.set('error');
      },
    });
  }

  simulate(): void {
    const total    = this.simTotalAmount();
    const down     = this.simDownPayment();
    const n        = this.simInstallmentCount();
    const freq     = this.simFrequency();
    const start    = this.simFirstDate();
    const financed = Math.max(0, total - down);
    const base     = Math.floor(financed / n);
    const remainder = financed - base * n;

    const items: PaymentInstallmentDto[] = Array.from({ length: n }, (_, i) => ({
      installmentNumber: i + 1,
      dueDate:           this.addPeriod(start, freq, i),
      amount:            i === n - 1 ? base + remainder : base,
      status:            'SCHEDULED',
    }));

    this.installments.set(items);
    this.simulated.set(true);
  }

  updateInstallmentDate(index: number, date: string): void {
    this.installments.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], dueDate: date };
      return copy;
    });
  }

  updateInstallmentAmount(index: number, amount: number): void {
    this.installments.update(list => {
      const copy = [...list];
      copy[index] = { ...copy[index], amount };
      return copy;
    });
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    const command: PaymentPlanCommand = {
      caseId:               this.caseId(),
      totalAmount:          this.simTotalAmount(),
      installmentCount:     this.simInstallmentCount(),
      firstInstallmentDate: this.simFirstDate(),
      frequency:            this.simFrequency(),
      derogation:           this.validationRequired(),
      derogationReason:     this.validationRequired() ? this.validationComment() : undefined,
      installments:         this.installments(),
    };
    this.paymentSvc.createPaymentPlan(command).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastMsg.set('Échéancier créé avec succès.');
        this.showToast.set(true);
        setTimeout(() => this.router.navigate(['/dossiers', this.caseId()]), 1800);
      },
      error: () => {
        this.submitting.set(false);
        this.toastMsg.set("Erreur lors de la création de l'échéancier.");
        this.showToast.set(true);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/dossiers', this.caseId()]);
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  protected formatAmount(amount: number, currency = 'MAD'): string {
    return (
      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(amount) +
      ' ' +
      currency
    );
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private nextMonthFirst(): string {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }

  private addPeriod(startDate: string, freq: PaymentPlanFrequency, n: number): string {
    const d = new Date(startDate + 'T00:00:00');
    switch (freq) {
      case 'MONTHLY':   d.setMonth(d.getMonth() + n);      break;
      case 'WEEKLY':    d.setDate(d.getDate() + n * 7);    break;
      case 'BIMONTHLY': d.setMonth(d.getMonth() + n * 2);  break;
    }
    return d.toISOString().slice(0, 10);
  }
}
