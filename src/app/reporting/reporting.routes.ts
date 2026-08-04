import { Routes } from '@angular/router';

export const REPORTING_ROUTES: Routes = [
  {
    path: '',
    data: { breadcrumb: 'Rapports' },
    loadComponent: () =>
      import('./reporting.component').then(m => m.ReportingComponent),
  },
];
