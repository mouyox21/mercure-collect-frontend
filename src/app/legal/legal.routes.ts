import { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./contentieux/contentieux.component').then(m => m.ContentieuxComponent),
  },
];
