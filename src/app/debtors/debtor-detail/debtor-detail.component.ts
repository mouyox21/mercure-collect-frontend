import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DebtorService } from '../../shared/data-access/debtor.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { DebtorDetailDto } from '../../shared/data-access/models/debtor.model';
import {
  ErrorStateComponent,
  ForbiddenStateComponent,
  SkeletonLoaderComponent,
} from '../../shared/ui';
import { ViewState } from '../../shared/ui/ui.types';

type TabId =
  | 'vue360'
  | 'infos'
  | 'contrats'
  | 'dossiers'
  | 'interactions'
  | 'documents'
  | 'garanties'
  | 'historique';

@Component({
  selector: 'mc-debtor-detail',
  standalone: true,
  imports: [
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
  ],
  templateUrl: './debtor-detail.component.html',
  styleUrl: './debtor-detail.component.scss',
})
export class ClientsDebtoridComponent implements OnInit {
  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly debtorSvc = inject(DebtorService);
  private readonly permSvc   = inject(PermissionService);

  private readonly debtorId = signal('');

  readonly viewState = signal<ViewState>('loading');
  readonly detail    = signal<DebtorDetailDto | null>(null);
  readonly activeTab = signal<TabId>('vue360');

  // CA-CLD-03 — permission gates
  readonly canViewContacts  = computed(() => this.permSvc.hasRight('CLIENT_CONTACT_VIEW'));
  readonly canViewFinancial = computed(() => this.permSvc.hasRight('CLIENT_FINANCIAL_VIEW'));

  // Masked contact fields — reactive to permission
  readonly displayPhone = computed(() => {
    const d = this.detail();
    if (!d) return '';
    return this.canViewContacts() ? (d.mainPhone || '—') : '••••••';
  });

  readonly displayEmail = computed(() => {
    const d = this.detail();
    if (!d) return '';
    return this.canViewContacts() ? (d.email || '—') : '••••••';
  });

  // Masked financial amounts — reactive to permission
  readonly displayOverdueAmount = computed(() => {
    const d = this.detail();
    if (!d) return '';
    return this.canViewFinancial() ? this.formatAmount(d.kpi.totalOverdueAmount) : '•••••• MAD';
  });

  readonly displayTotalDebt = computed(() => {
    const d = this.detail();
    if (!d) return '';
    return this.canViewFinancial() ? this.formatAmount(d.kpi.totalDebtAmount) : '•••••• MAD';
  });

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'vue360',       label: 'Vue 360°'             },
    { id: 'infos',        label: 'Informations générales' },
    { id: 'contrats',     label: 'Contrats & dettes'    },
    { id: 'dossiers',     label: 'Dossiers'             },
    { id: 'interactions', label: 'Interactions'         },
    { id: 'documents',    label: 'Documents'            },
    { id: 'garanties',    label: 'Garanties'            },
    { id: 'historique',   label: 'Historique'           },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('debtorId') ?? '';
    this.debtorId.set(id);
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.debtorSvc.getDebtor(this.debtorId()).subscribe({
      next: d  => { this.detail.set(d); this.viewState.set('success'); },
      error: (err: any) => {
        if (err?.status === 403) { this.viewState.set('forbidden'); return; }
        this.viewState.set('error');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/clients']);
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  protected clientTypeLabel(t: string): string {
    const M: Record<string, string> = {
      PARTICULIER: 'Particulier', ENTREPRISE: 'Entreprise', ASSOCIATION: 'Association',
    };
    return M[t] ?? t;
  }

  protected statusLabel(s: string): string {
    const M: Record<string, string> = { ACTIVE: 'Actif', INACTIVE: 'Inactif', SUSPENDED: 'Suspendu' };
    return M[s] ?? s;
  }

  protected statusModifier(s: string): string {
    const M: Record<string, string> = { ACTIVE: 'active', INACTIVE: 'inactive', SUSPENDED: 'suspended' };
    return M[s] ?? 'active';
  }

  protected riskSegmentLabel(s: string): string {
    const M: Record<string, string> = {
      STANDARD: 'Standard', VIP: 'VIP', SENSIBLE: 'Sensible', RISK: 'À risque',
    };
    return M[s] ?? s;
  }

  protected riskModifier(s: string): string {
    return (s ?? '').toLowerCase();
  }

  protected contractStatusLabel(s: string): string {
    const M: Record<string, string> = {
      ACTIVE: 'Actif', OVERDUE: 'Impayé', LEGAL: 'Contentieux', CLOSED: 'Clôturé',
    };
    return M[s] ?? s;
  }

  protected contractModifier(s: string): string {
    return (s ?? '').toLowerCase();
  }

  protected debtStatusLabel(s: string): string {
    const M: Record<string, string> = {
      OVERDUE: 'Impayé', LEGAL: 'Contentieux', PAID: 'Payé', NEGOTIATED: 'Négocié',
    };
    return M[s] ?? s;
  }

  protected guaranteeTypeLabel(t: string): string {
    const M: Record<string, string> = {
      HYPOTHEQUE: 'Hypothèque', CAUTIONNEMENT: 'Cautionnement',
      NANTISSEMENT: 'Nantissement', PRIVILEGE: 'Privilège',
    };
    return M[t] ?? t;
  }

  protected channelIcon(ch: string): string {
    const M: Record<string, string> = {
      PHONE: '📞', EMAIL: '📧', LETTER: '✉️', SMS: '💬', VISIT: '🏢',
    };
    return M[ch] ?? '📋';
  }

  protected formatAmount(amount: number, currency = 'MAD'): string {
    return (
      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(amount) +
      ' ' + currency
    );
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  protected maskContractAmount(v: number): string {
    return this.canViewFinancial() ? this.formatAmount(v) : '•••••• MAD';
  }
}
