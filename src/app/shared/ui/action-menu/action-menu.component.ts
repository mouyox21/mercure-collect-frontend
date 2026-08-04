import { Component, ElementRef, HostListener, input, output, signal } from '@angular/core';
import { ActionMenuItem, ActionType } from '../ui.types';

const DEFAULT_ACTIONS: ActionMenuItem[] = [
  { type: 'appeler',    label: 'Appeler',     icon: '📞' },
  { type: 'sms',        label: 'SMS',         icon: '💬' },
  { type: 'email',      label: 'E-mail',      icon: '✉️' },
  { type: 'lettre',     label: 'Lettre',      icon: '📄' },
  { type: 'promesse',   label: 'Promesse',    icon: '🤝' },
  { type: 'echeancier', label: 'Échéancier',  icon: '📅' },
  { type: 'escalader',  label: 'Escalader',   icon: '⚠️' },
];

@Component({
  selector: 'mc-action-menu',
  standalone: true,
  templateUrl: './action-menu.component.html',
  styleUrl: './action-menu.component.scss',
})
export class ActionMenuComponent {
  readonly actions = input<ActionMenuItem[]>(DEFAULT_ACTIONS);
  readonly triggerLabel = input<string>('Actions');

  readonly actionSelected = output<ActionType>();

  protected readonly isOpen = signal(false);

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  protected toggle(): void {
    this.isOpen.update((v) => !v);
  }

  protected select(action: ActionMenuItem): void {
    if (action.disabled) return;
    this.actionSelected.emit(action.type);
    this.isOpen.set(false);
  }

  protected onItemKeydown(event: KeyboardEvent, action: ActionMenuItem): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(action);
    }
    if (event.key === 'Escape') {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    this.isOpen.set(false);
  }
}
