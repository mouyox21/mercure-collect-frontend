import { Component, input, output } from '@angular/core';

@Component({
  selector: 'mc-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  readonly message     = input.required<string>();
  readonly actionLabel = input<string | undefined>(undefined);

  readonly action = output<void>();
}
