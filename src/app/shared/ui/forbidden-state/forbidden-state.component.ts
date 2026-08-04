import { Component, input } from '@angular/core';

@Component({
  selector: 'mc-forbidden-state',
  standalone: true,
  templateUrl: './forbidden-state.component.html',
  styleUrl: './forbidden-state.component.scss',
})
export class ForbiddenStateComponent {
  readonly message = input<string>('Vous n\'avez pas les droits nécessaires pour accéder à cette section.');
}
