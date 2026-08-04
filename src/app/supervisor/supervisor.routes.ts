import { Routes } from '@angular/router';

export const SUPERVISOR_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/supervisor-dashboard.component').then(m => m.SuperviseurDashboardComponent),
  },
  {
    path: 'escalades',
    data: { breadcrumb: 'Console des escalades' },
    loadComponent: () =>
      import('./escalades/supervisor-escalades.component').then(m => m.SuperviseurEscaladesComponent),
  },
  {
    path: 'ia-dmn',
    data: { breadcrumb: 'Supervision IA / DMN' },
    loadComponent: () =>
      import('./ia-dmn/supervisor-ia-dmn.component').then(m => m.SuperviseurIaDmnComponent),
  },
  {
    path: 'equipe',
    data: { breadcrumb: 'Équipe' },
    loadComponent: () =>
      import('./equipe/supervisor-equipe.component').then(m => m.SuperviseurEquipeComponent),
  },
  // Stub temporaire — à implémenter ultérieurement.
  { path: 'portefeuilles', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
