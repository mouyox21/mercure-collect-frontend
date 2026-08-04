import {
  Component,
  ElementRef,
  HostListener,
  OnChanges,
  SimpleChanges,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ActionModalType,
  ActionSubmitEvent,
  CaseContextDto,
  TimelineChannel,
  TimelineEvent,
  TimelineEventType,
} from '../ui.types';

const TYPE_LABELS: Record<ActionModalType, string> = {
  PHONE_CALL:     'Appel téléphonique',
  SMS:            'SMS',
  EMAIL:          'E-mail',
  LETTER:         'Courrier',
  VISIT:          'Visite',
  RELANCE:        'Relance',
  CONTACT_SEARCH: 'Recherche contact',
};

const TYPE_ICONS: Record<ActionModalType, string> = {
  PHONE_CALL:     '📞',
  SMS:            '💬',
  EMAIL:          '📧',
  LETTER:         '✉️',
  VISIT:          '🏠',
  RELANCE:        '🔔',
  CONTACT_SEARCH: '🔍',
};

const TYPE_TO_CHANNEL: Record<ActionModalType, TimelineChannel> = {
  PHONE_CALL:     'telephone',
  SMS:            'sms',
  EMAIL:          'email',
  LETTER:         'lettre',
  VISIT:          'reunion',
  RELANCE:        'telephone',
  CONTACT_SEARCH: 'telephone',
};

const OUTCOME_OPTIONS: { readonly value: string; readonly label: string }[] = [
  { value: 'PROMISE',         label: 'Promesse obtenue'              },
  { value: 'CONTACT_SUCCESS', label: 'Contact établi, sans promesse' },
  { value: 'NO_ANSWER',       label: 'Pas de réponse'                },
  { value: 'VOICEMAIL',       label: 'Messagerie vocale'             },
  { value: 'WRONG_NUMBER',    label: 'Mauvais numéro'                },
  { value: 'REFUSAL',         label: 'Refus de paiement'             },
  { value: 'MESSAGE_LEFT',    label: 'Message laissé'                },
  { value: 'INFO_GATHERED',   label: 'Information collectée'         },
];

const NON_PAYMENT_REASONS: { readonly value: string; readonly label: string }[] = [
  { value: 'FINANCIAL_DIFFICULTY', label: 'Difficultés financières'  },
  { value: 'DISPUTES_DEBT',        label: 'Conteste la dette'        },
  { value: 'AWAITING_INFO',        label: "En attente d'information" },
  { value: 'ADMINISTRATIVE',       label: 'Problème administratif'   },
  { value: 'OTHER',                label: 'Autre'                    },
];

// Outcomes that imply the client was reached
const OUTCOME_CONTACTED: Record<string, boolean> = {
  PROMISE:         true,
  CONTACT_SUCCESS: true,
  REFUSAL:         true,
  NO_ANSWER:       false,
  VOICEMAIL:       false,
  WRONG_NUMBER:    false,
  MESSAGE_LEFT:    false,
  INFO_GATHERED:   true,
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert', PENDING: 'En attente', SUSPENDED: 'Suspendu', CLOSED: 'Clôturé',
};

@Component({
  selector: 'mc-action-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './action-modal.component.html',
  styleUrl: './action-modal.component.scss',
})
export class ActionModalComponent implements OnChanges {
  readonly open            = input.required<boolean>();
  readonly caseContext     = input.required<CaseContextDto>();
  readonly preselectedType = input<ActionModalType | null>(null);

  readonly submitted = output<ActionSubmitEvent>();
  readonly closed    = output<void>();

  protected readonly allTypes: ActionModalType[] = [
    'PHONE_CALL', 'SMS', 'EMAIL', 'LETTER', 'VISIT', 'RELANCE', 'CONTACT_SEARCH',
  ];
  protected readonly typeLabels        = TYPE_LABELS;
  protected readonly typeIcons         = TYPE_ICONS;
  protected readonly outcomeOptions    = OUTCOME_OPTIONS;
  protected readonly nonPaymentReasons = NON_PAYMENT_REASONS;

  protected readonly selectedType = signal<ActionModalType | null>(null);

  // Public for spec access
  form!: FormGroup;
  private readonly dialogRef = viewChild<ElementRef<HTMLDivElement>>('dialogEl');

  constructor(private readonly fb: FormBuilder) {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open()) {
      this.selectedType.set(this.preselectedType() ?? null);
      this.buildForm();
      setTimeout(() => this.focusFirstElement(), 0);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      scheduledDate:    [this.todayIso(), Validators.required],
      durationMinutes:  [null as number | null],
      outcome:          ['', Validators.required],
      nonPaymentReason: [''],
      commentaire:      ['', Validators.required],
      createPromise:    [false],
      promiseDate:      [''],
      promiseAmount:    [null as number | null],
    });

    // Dynamic validators for promise sub-form
    this.form.get('createPromise')!.valueChanges.subscribe((val: boolean) => {
      const dateCtrl = this.form.get('promiseDate')!;
      const amtCtrl  = this.form.get('promiseAmount')!;
      if (val) {
        dateCtrl.setValidators(Validators.required);
        amtCtrl.setValidators([Validators.required, Validators.min(0.01)]);
      } else {
        dateCtrl.clearValidators();
        amtCtrl.clearValidators();
      }
      dateCtrl.updateValueAndValidity();
      amtCtrl.updateValueAndValidity();
    });
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private focusFirstElement(): void {
    const el = this.dialogRef()?.nativeElement.querySelector<HTMLElement>(
      'button, input, select, textarea'
    );
    el?.focus();
  }

  protected selectType(type: ActionModalType): void {
    this.selectedType.set(type);
  }

  protected get showDuration(): boolean {
    return this.selectedType() === 'PHONE_CALL' || this.selectedType() === 'VISIT';
  }

  protected get contacted(): boolean {
    return OUTCOME_CONTACTED[this.form.get('outcome')?.value ?? ''] ?? false;
  }

  protected get showNonPaymentReason(): boolean {
    const outcome = (this.form.get('outcome')?.value as string) ?? '';
    return this.contacted && outcome !== 'PROMISE' && outcome !== 'INFO_GATHERED';
  }

  protected get hasPromise(): boolean {
    return this.form.get('createPromise')?.value === true;
  }

  protected onSubmit(): void {
    if (!this.selectedType()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw     = this.form.getRawValue();
    const type    = this.selectedType()!;
    const channel = TYPE_TO_CHANNEL[type];
    const ctx     = this.caseContext();
    const entryDate = raw.scheduledDate ? new Date(raw.scheduledDate) : new Date();

    const outcomeLabel = OUTCOME_OPTIONS.find(o => o.value === raw.outcome)?.label ?? raw.outcome;

    const timelineEntry: TimelineEvent = {
      id:          `act-${Date.now()}`,
      date:        entryDate,
      channel,
      type:        'action' as TimelineEventType,
      description: `${TYPE_LABELS[type]} — ${outcomeLabel}. ${raw.commentaire}`.trimEnd(),
    };

    let promiseTimelineEntry: TimelineEvent | undefined;
    if (raw.createPromise && raw.promiseDate && raw.promiseAmount != null) {
      promiseTimelineEntry = {
        id:          `prom-${Date.now() + 1}`,
        date:        new Date(raw.promiseDate),
        channel:     'telephone' as TimelineChannel,
        type:        'promesse' as TimelineEventType,
        description: `Promesse de paiement — suite à ${TYPE_LABELS[type].toLowerCase()}.`,
        amount:      raw.promiseAmount,
      };
    }

    this.submitted.emit({
      caseId:           ctx.caseId,
      actionType:       type,
      channel,
      scheduledDate:    raw.scheduledDate,
      outcome:          raw.outcome,
      contacted:        OUTCOME_CONTACTED[raw.outcome] ?? false,
      nonPaymentReason: raw.nonPaymentReason || undefined,
      commentaire:      raw.commentaire,
      durationMinutes:  raw.durationMinutes ?? undefined,
      createPromise:    raw.createPromise === true,
      promiseDate:      raw.promiseDate   || undefined,
      promiseAmount:    raw.promiseAmount ?? undefined,
      timelineEntry,
      promiseTimelineEntry,
    });

    this.closeModal();
  }

  protected closeModal(): void {
    this.form.reset();
    this.selectedType.set(null);
    this.closed.emit();
  }

  protected onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeModal();
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.closeModal();
  }

  protected hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  protected formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(amount) + ' MAD';
  }

  protected statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }
}
