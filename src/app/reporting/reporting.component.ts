import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ReportingService } from '../shared/data-access/reporting.service';
import { PermissionService } from '../shared/data-access/permission.service';
import { KpiResponse, ReportingFilterDto, ReportingPeriod } from '../shared/data-access/models/reporting.model';
import { RoleProfile } from '../shared/data-access/permission.types';
import { ViewState } from '../shared/ui/ui.types';
import {
  KpiCardComponent,
  SkeletonLoaderComponent,
  ErrorStateComponent,
  ForbiddenStateComponent,
  SuccessToastComponent,
  StaleDataBannerComponent,
} from '../shared/ui';
import { SupersetEmbedFrameComponent } from './superset-embed-frame/superset-embed-frame.component';

interface ReportItem {
  id: string;
  icon: string;
  title: string;
  roles: RoleProfile[];
}

const REPORT_CATALOGUE: ReportItem[] = [
  { id: 'RPT-001', icon: '📊', title: 'Performance de recouvrement',  roles: ['agent', 'superviseur', 'manager', 'administrateur'] },
  { id: 'RPT-002', icon: '🤝', title: 'Taux de promesses tenues',     roles: ['agent', 'superviseur', 'manager', 'administrateur'] },
  { id: 'RPT-003', icon: '⏱️', title: 'Aging des créances',            roles: ['superviseur', 'manager', 'administrateur'] },
  { id: 'RPT-004', icon: '👥', title: 'Performance équipe',            roles: ['superviseur', 'manager', 'administrateur'] },
  { id: 'RPT-005', icon: '🔺', title: 'Suivi des escalades',           roles: ['superviseur', 'manager', 'administrateur'] },
  { id: 'RPT-006', icon: '🤖', title: 'Analyse IA / DMN',              roles: ['superviseur', 'manager', 'administrateur'] },
  { id: 'RPT-007', icon: '🏦', title: 'Encours par créancier',         roles: ['administrateur'] },
  { id: 'RPT-008', icon: '📥', title: 'Imports & rejets',              roles: ['administrateur'] },
  { id: 'RPT-009', icon: '🔍', title: 'Audit des actions',             roles: ['administrateur'] },
  { id: 'RPT-010', icon: '⚖️', title: 'Contentieux actifs',            roles: ['superviseur', 'manager', 'administrateur'] },
];

@Component({
  selector: 'mc-reporting',
  standalone: true,
  imports: [
    KpiCardComponent,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
    SuccessToastComponent,
    StaleDataBannerComponent,
    SupersetEmbedFrameComponent,
  ],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.scss',
})
export class ReportingComponent implements OnInit {
  private readonly reportingSvc  = inject(ReportingService);
  private readonly permissionSvc = inject(PermissionService);

  readonly CREDITORS = [
    { id: '',         label: 'Tous créanciers'     },
    { id: 'CRED-001', label: 'BankA Finance'       },
    { id: 'CRED-002', label: 'FinCo Maroc'         },
    { id: 'CRED-003', label: 'Société Générale'    },
  ];

  readonly PERIOD_OPTIONS: { value: ReportingPeriod | ''; label: string }[] = [
    { value: '',        label: 'Toutes périodes'  },
    { value: 'DAY',     label: "Aujourd'hui"      },
    { value: 'WEEK',    label: 'Cette semaine'    },
    { value: 'MONTH',   label: 'Ce mois'          },
    { value: 'QUARTER', label: 'Ce trimestre'     },
  ];

  readonly PORTFOLIOS = [
    { value: '',           label: 'Tous portefeuilles' },
    { value: 'PTF-NORD',   label: 'PTF Nord'           },
    { value: 'PTF-SUD',    label: 'PTF Sud'            },
    { value: 'PTF-EST',    label: 'PTF Est'            },
  ];

  readonly AGENCIES = [
    { value: '',               label: 'Toutes agences'  },
    { value: 'AGE-CASABLANCA', label: 'Casablanca'      },
    { value: 'AGE-RABAT',      label: 'Rabat'           },
    { value: 'AGE-FES',        label: 'Fès'             },
  ];

  readonly CLIENT_TYPES = [
    { value: '',             label: 'Tous types'   },
    { value: 'PARTICULIER',  label: 'Particulier'  },
    { value: 'PME',          label: 'PME'          },
    { value: 'GRAND_COMPTE', label: 'Grand compte' },
  ];

  readonly PRODUCTS = [
    { value: '',            label: 'Tous produits'  },
    { value: 'CONSO',       label: 'Crédit conso'   },
    { value: 'IMMO',        label: 'Immobilier'     },
    { value: 'LEASING',     label: 'Leasing'        },
  ];

  // Filter signals
  readonly filterCreditor   = signal('');
  readonly filterPeriod     = signal<ReportingPeriod | ''>('MONTH');
  readonly filterPortfolio  = signal('');
  readonly filterAgency     = signal('');
  readonly filterAgent      = signal('');
  readonly filterClientType = signal('');
  readonly filterProduct    = signal('');

  // Data & view state
  readonly viewState  = signal<ViewState>('loading');
  readonly kpis       = signal<KpiResponse[]>([]);
  readonly dataDate   = signal('');
  readonly showToast  = signal(false);
  readonly toastMsg   = signal('');

  // Active report in catalogue (default to first item)
  readonly activeReport = signal<string>('RPT-001');

  // Catalogue filtered by current user profile
  readonly catalogue = computed(() => {
    const profile = this.permissionSvc.currentProfile();
    return REPORT_CATALOGUE.filter(r => r.roles.includes(profile));
  });

  readonly topKpis   = computed(() => this.kpis().slice(0, 5));
  readonly chartKpis = computed(() => this.kpis());

  // REPORT_VIEW  — accès à l'écran, catalogue et dashboards
  readonly canView   = computed(() => this.permissionSvc.hasRight('REPORT_VIEW'));
  // REPORT_EXPORT — boutons PDF/Excel/CSV (droit plus restrictif, indépendant)
  readonly canExport = computed(() => this.permissionSvc.hasRight('REPORT_EXPORT'));

  ngOnInit(): void {
    if (!this.canView()) {
      this.viewState.set('forbidden');
      return;
    }
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    const filter: ReportingFilterDto = {
      creditorId: this.filterCreditor() || undefined,
      period:     (this.filterPeriod() as ReportingPeriod) || undefined,
      teamId:     this.filterPortfolio() || undefined,
      agentId:    this.filterAgent().trim() || undefined,
      reportType: this.filterClientType() || undefined,
    };
    this.reportingSvc.getKpis(filter).subscribe({
      next: page => {
        this.kpis.set(page.kpis);
        this.dataDate.set(page.filters.dateTo ?? '');
        this.viewState.set('success');
      },
      error: () => this.viewState.set('error'),
    });
  }

  onExport(format: 'PDF' | 'EXCEL' | 'CSV'): void {
    this.toastMsg.set(`Export ${format} lancé — le téléchargement démarrera dans quelques instants.`);
    this.showToast.set(true);
  }

  setFilterCreditor(v: string):   void { this.filterCreditor.set(v);   }
  setFilterPeriod(v: string):     void { this.filterPeriod.set(v as ReportingPeriod | ''); }
  setFilterPortfolio(v: string):  void { this.filterPortfolio.set(v);  }
  setFilterAgency(v: string):     void { this.filterAgency.set(v);     }
  setFilterAgent(v: string):      void { this.filterAgent.set(v);      }
  setFilterClientType(v: string): void { this.filterClientType.set(v); }
  setFilterProduct(v: string):    void { this.filterProduct.set(v);    }

  protected formatKpiValue(kpi: KpiResponse): string | number {
    if (kpi.unit === 'MAD') {
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(kpi.value) + ' MAD';
    }
    if (kpi.unit === 'actions') return kpi.value.toFixed(1);
    return kpi.value;
  }

  protected kpiUnit(kpi: KpiResponse): string {
    return kpi.unit === 'MAD' || kpi.unit === 'actions' ? '' : kpi.unit;
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
