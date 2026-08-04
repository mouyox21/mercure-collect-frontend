import { Component, input, output } from '@angular/core';

@Component({
  selector: 'mc-error-state',
  standalone: true,
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  readonly message   = input<string>('Une erreur est survenue. Veuillez réessayer.');
  readonly errorCode = input<string | undefined>(undefined);

  readonly retry = output<void>();
}
