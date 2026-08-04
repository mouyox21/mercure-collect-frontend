import { Routes } from '@angular/router';
import { ClientsComponent } from './debtors.component';

export const DEBTORS_ROUTES: Routes = [
  { path: '', component: ClientsComponent },
  {
    path: ':debtorId',
    data: { breadcrumb: 'Détail client' },
    loadComponent: () =>
      import('./debtor-detail/debtor-detail.component').then(m => m.ClientsDebtoridComponent),
  },
];
