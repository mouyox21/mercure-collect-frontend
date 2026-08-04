import { Routes } from '@angular/router';
import { CollectionCasesComponent } from './collection-cases.component';

export const COLLECTION_CASES_ROUTES: Routes = [
  { path: '', component: CollectionCasesComponent },
  {
    path: ':caseId',
    data: { breadcrumb: 'Détail dossier' },
    loadComponent: () =>
      import('./case-detail/case-detail.component').then(m => m.CaseDetailComponent),
  },
  {
    path: ':caseId/echeanciers',
    data: { breadcrumb: 'Nouvel échéancier' },
    loadComponent: () =>
      import('./payment-schedule/payment-schedule.component').then(
        m => m.PaymentScheduleComponent,
      ),
  },
];
