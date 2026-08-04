import {
  Component,
  ElementRef,
  HostListener,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CaseContextDto } from '../ui.types';
import { CreatePromiseCommand } from '../../data-access/models/payment.model';

const CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'PHONE_CALL', label: 'Appel téléphonique' },
  { value: 'SMS',        label: 'SMS'                },
  { value: 'EMAIL',      label: 'E-mail'             },
  { value: 'VISIT',      label: 'Visite'             },
];

const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: 'MAD', label: 'MAD – Dirham marocain'  },
  { value: 'EUR', label: 'EUR – Euro'              },
  { value: 'USD', label: 'USD – Dollar américain'  },
];

@Component({
  selector: 'mc-promise-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './promise-modal.component.html',
  styleUrl: './promise-modal.component.scss',
})
export class PromiseModalComponent implements OnChanges {
  readonly open        = input.required<boolean>();
  readonly caseContext = input.required<CaseContextDto>();

  readonly submitted = output<CreatePromiseCommand>();
  readonly closed    = output<void>();

  protected readonly channelOptions  = CHANNEL_OPTIONS;
  protected readonly currencyOptions = CURRENCY_OPTIONS;

  form!: FormGroup;
  private readonly dialogRef = viewChild<ElementRef<HTMLDivElement>>('dialogEl');
  private readonly fb        = inject(FormBuilder);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open()) {
      this.buildForm();
      setTimeout(() => this.focusFirstElement(), 0);
    }
  }

  private buildForm(): void {
    const ctx   = this.caseContext();
    const today = new Date().toISOString().slice(0, 10);

    this.form = this.fb.group({
      promiseAmount:            [null as number | null, [
        Validators.required,
        Validators.min(0.01),
        this.maxAmountValidator(ctx.overdueAmount),
      ]],
      promiseDate:              ['', [Validators.required, this.minDateValidator(today)]],
      currency:                 ['MAD', Validators.required],
      channel:                  ['PHONE_CALL', Validators.required],
      notes:                    [''],
      derogation:               [false],
      derogationReason:         [''],
      historicalRegularization: [false],
    });

    // Derogation → remove max-amount constraint, require reason
    this.form.get('derogation')!.valueChanges.subscribe((derog: boolean) => {
      const amtCtrl    = this.form.get('promiseAmount')!;
      const reasonCtrl = this.form.get('derogationReason')!;
      amtCtrl.setValidators(derog
        ? [Validators.required, Validators.min(0.01)]
        : [Validators.required, Validators.min(0.01), this.maxAmountValidator(ctx.overdueAmount)]
      );
      reasonCtrl.setValidators(derog ? [Validators.required] : []);
      amtCtrl.updateValueAndValidity();
      reasonCtrl.updateValueAndValidity();
    });

    // Historical regularization → remove min-date constraint
    this.form.get('historicalRegularization')!.valueChanges.subscribe((hist: boolean) => {
      const dateCtrl = this.form.get('promiseDate')!;
      dateCtrl.setValidators(hist
        ? [Validators.required]
        : [Validators.required, this.minDateValidator(today)]
      );
      dateCtrl.updateValueAndValidity();
    });
  }

  private maxAmountValidator(max: number) {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const v = ctrl.value;
      if (v == null || v === '') return null;
      return Number(v) > max ? { maxAmount: { max, actual: v } } : null;
    };
  }

  private minDateValidator(min: string) {
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const v = ctrl.value as string;
      if (!v) return null;
      return v < min ? { minDate: { min, actual: v } } : null;
    };
  }

  private focusFirstElement(): void {
    const el = this.dialogRef()?.nativeElement.querySelector<HTMLElement>(
      'input, select, textarea, button'
    );
    el?.focus();
  }

  protected get isDerogation(): boolean {
    return this.form?.get('derogation')?.value === true;
  }

  protected get isHistoricalReg(): boolean {
    return this.form?.get('historicalRegularization')?.value === true;
  }

  protected hasError(field: string): boolean {
    const ctrl = this.form?.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  protected getError(field: string): string {
    const ctrl = this.form?.get(field);
    if (!ctrl?.errors || !ctrl.touched) return '';
    if (ctrl.errors['required'])  return 'Ce champ est obligatoire.';
    if (ctrl.errors['min'])       return 'La valeur doit être supérieure à 0.';
    if (ctrl.errors['maxAmount']) {
      const max = ctrl.errors['maxAmount'].max as number;
      const fmt = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(max);
      return `Le montant ne peut pas dépasser ${fmt} MAD (montant impayé). Cochez la case dérogation si autorisé.`;
    }
    if (ctrl.errors['minDate']) {
      return 'La date prévue ne peut pas être dans le passé. Cochez la case régularisation historique si applicable.';
    }
    return 'Valeur invalide.';
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.submitted.emit({
      caseId:                   this.caseContext().caseId,
      promiseAmount:            raw.promiseAmount,
      promiseDate:              raw.promiseDate,
      currency:                 raw.currency,
      channel:                  raw.channel,
      notes:                    raw.notes || undefined,
      derogation:               raw.derogation === true,
      derogationReason:         raw.derogationReason || undefined,
      historicalRegularization: raw.historicalRegularization === true,
    });
    this.closeModal();
  }

  protected closeModal(): void {
    this.form.reset({ currency: 'MAD', channel: 'PHONE_CALL' });
    this.closed.emit();
  }

  protected onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeModal();
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.closeModal();
  }

  protected formatOverdueAmount(): string {
    const ctx = this.caseContext();
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(ctx.overdueAmount) + ' MAD';
  }

  protected todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
