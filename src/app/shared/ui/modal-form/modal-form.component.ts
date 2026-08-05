import {
  Component,
  computed,
  ElementRef,
  HostListener,
  input,
  OnChanges,
  OnInit,
  output,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalFormValue, ModalUsage } from '../ui.types';

interface ModalConfig {
  readonly title: string;
  readonly showDate: boolean;
  readonly showAmount: boolean;
  readonly showCanal: boolean;
  readonly motifRequired: boolean;
  readonly commentaireRequired: boolean;
  readonly submitLabel: string;
}

const MODAL_CONFIGS: Record<ModalUsage, ModalConfig> = {
  action: {
    title: 'Enregistrer une action',
    showDate: false,
    showAmount: false,
    showCanal: true,
    motifRequired: false,
    commentaireRequired: true,
    submitLabel: 'Enregistrer',
  },
  promesse: {
    title: 'Enregistrer une promesse',
    showDate: true,
    showAmount: true,
    showCanal: false,
    motifRequired: false,
    commentaireRequired: true,
    submitLabel: 'Confirmer la promesse',
  },
  echeancier: {
    title: "Créer un échéancier",
    showDate: true,
    showAmount: true,
    showCanal: false,
    motifRequired: false,
    commentaireRequired: false,
    submitLabel: "Valider l'échéancier",
  },
  document: {
    title: 'Ajouter un document',
    showDate: false,
    showAmount: false,
    showCanal: false,
    motifRequired: true,
    commentaireRequired: false,
    submitLabel: 'Téléverser',
  },
  escalade: {
    title: 'Escalader le dossier',
    showDate: false,
    showAmount: false,
    showCanal: false,
    motifRequired: true,
    commentaireRequired: true,
    submitLabel: 'Escalader',
  },
  cloture: {
    title: 'Confirmer la clôture du dossier',
    showDate: false,
    showAmount: false,
    showCanal: false,
    motifRequired: true,
    commentaireRequired: false,
    submitLabel: 'Confirmer la clôture',
  },
};

const CANAL_OPTIONS = ['Téléphone', 'SMS', 'E-mail', 'Lettre', 'Réunion'] as const;

@Component({
  selector: 'mc-modal-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './modal-form.component.html',
  styleUrl: './modal-form.component.scss',
})
export class ModalFormComponent implements OnInit, OnChanges {
  readonly open = input.required<boolean>();
  readonly usage = input.required<ModalUsage>();

  readonly submitted = output<ModalFormValue>();
  readonly closed = output<void>();

  protected readonly config = computed<ModalConfig>(() => MODAL_CONFIGS[this.usage()]);
  protected readonly canalOptions = CANAL_OPTIONS;

  // Public so specs can set values directly without going through the DOM.
  form!: FormGroup;

  private readonly dialogRef = viewChild<ElementRef<HTMLDivElement>>('dialogEl');

  constructor(private readonly fb: FormBuilder) {
    // Build a placeholder form so the template never sees an undefined form.
    this.form = this.fb.group({
      motif: [''],
      commentaire: [''],
      date: [''],
      montant: [null as number | null],
      canal: [''],
    });
  }

  ngOnInit(): void {
    // Rebuild with correct validators now that signal inputs are available.
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usage'] && !changes['usage'].firstChange) {
      this.buildForm();
    }
    if (changes['open'] && this.open()) {
      setTimeout(() => this.focusFirstElement(), 0);
    }
  }

  private buildForm(): void {
    const cfg = MODAL_CONFIGS[this.usage()];
    this.form = this.fb.group({
      motif:       ['', cfg.motifRequired       ? Validators.required : []],
      commentaire: ['', cfg.commentaireRequired ? Validators.required : []],
      date:        ['', cfg.showDate            ? Validators.required : []],
      montant:     [null as number | null, cfg.showAmount ? [Validators.required, Validators.min(0.01)] : []],
      canal:       ['', cfg.showCanal           ? Validators.required : []],
    });
  }

  private focusFirstElement(): void {
    const dialog = this.dialogRef();
    const focusable = dialog?.nativeElement.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue() as {
      motif: string;
      commentaire: string;
      date?: string;
      montant?: number;
      canal?: string;
    };
    this.submitted.emit({
      motif:       raw.motif,
      commentaire: raw.commentaire,
      date:        raw.date ?? undefined,
      montant:     raw.montant ?? undefined,
      canal:       raw.canal ?? undefined,
    });
    this.closeModal();
  }

  protected closeModal(): void {
    this.form.reset();
    this.closed.emit();
  }

  protected onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.closeModal();
    }
  }

  protected hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
