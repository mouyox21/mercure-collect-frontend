import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: 'referentiels',
    data: { breadcrumb: 'Référentiels' },
    loadComponent: () =>
      import('./referentiels/referentiels.component').then(m => m.ParametragesReferentielsComponent),
  },
  {
    path: 'regles-workflows',
    data: { breadcrumb: 'Règles & Workflows' },
    loadComponent: () =>
      import('./regles-workflows/regles-workflows.component').then(m => m.ParametragesReglesWorkflowsComponent),
  },
  {
    path: 'imports',
    data: { breadcrumb: 'Imports' },
    loadComponent: () =>
      import('./imports/imports.component').then(m => m.ParametragesImportsComponent),
  },
  {
    path: 'audit',
    data: { breadcrumb: 'Audit' },
    loadComponent: () =>
      import('./audit/audit.component').then(m => m.ParametragesAuditComponent),
  },
  {
    path: '',
    redirectTo: 'referentiels',
    pathMatch: 'full',
  },
];
