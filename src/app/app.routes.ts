import { Routes } from '@angular/router';
import { ShellComponent } from './shell/shell.component';
import { roleGuard } from './shared/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./agent-workbench/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
      },
      {
        path: 'dossiers',
        data: { breadcrumb: 'Dossiers' },
        loadChildren: () =>
          import('./collection-cases/collection-cases.routes').then(m => m.COLLECTION_CASES_ROUTES),
      },
      {
        path: 'clients',
        data: { breadcrumb: 'Clients' },
        loadChildren: () =>
          import('./debtors/debtors.routes').then(m => m.DEBTORS_ROUTES),
      },
      {
        path: 'superviseur',
        canActivate: [roleGuard],
        data: { breadcrumb: 'Vue manager', requiredRight: 'CASE_ASSIGN' },
        loadChildren: () =>
          import('./supervisor/supervisor.routes').then(m => m.SUPERVISOR_ROUTES),
      },
      {
        path: 'contentieux',
        canActivate: [roleGuard],
        data: { breadcrumb: 'Contentieux', requiredRight: 'LEGAL_CASE_VIEW' },
        loadChildren: () =>
          import('./legal/legal.routes').then(m => m.LEGAL_ROUTES),
      },
      {
        path: 'rapports',
        canActivate: [roleGuard],
        data: { breadcrumb: 'Rapports', requiredRight: 'REPORT_VIEW' },
        loadChildren: () =>
          import('./reporting/reporting.routes').then(m => m.REPORTING_ROUTES),
      },
      {
        path: 'parametrages',
        canActivate: [roleGuard],
        data: { breadcrumb: 'Paramétrages', requiredRight: 'SETTINGS_MANAGE' },
        loadChildren: () =>
          import('./settings/settings.routes').then(m => m.SETTINGS_ROUTES),
      },
    ],
  },
];
