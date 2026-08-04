import { Component } from '@angular/core';

@Component({
  selector: 'mc-settings',
  standalone: true,
  template: `
    <section class="placeholder">
      <h1 class="placeholder__title">Paramétrages</h1>
      <p class="placeholder__body">Configuration de l'application — module en cours de développement.</p>
    </section>
  `,
  styles: [`
    .placeholder { padding: 32px; }
    .placeholder__title { font-size: 24px; font-weight: 600; margin: 0 0 8px; }
    .placeholder__body  { color: #64748b; }
  `],
})
export class SettingsComponent {}
