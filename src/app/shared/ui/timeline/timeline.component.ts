import { Component, computed, input, signal } from '@angular/core';
import { TimelineChannel, TimelineEvent, TimelineEventType } from '../ui.types';

const CHANNEL_LABELS: Record<TimelineChannel, string> = {
  telephone: 'Téléphone',
  sms:       'SMS',
  email:     'E-mail',
  lettre:    'Lettre',
  reunion:   'Réunion',
};

const TYPE_LABELS: Record<TimelineEventType, string> = {
  action:    'Action',
  promesse:  'Promesse',
  echeancier:'Échéancier',
  note:      'Note',
};

@Component({
  selector: 'mc-timeline',
  standalone: true,
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent {
  readonly events = input.required<TimelineEvent[]>();

  protected readonly activeChannels = signal<Set<TimelineChannel>>(new Set());
  protected readonly activeTypes = signal<Set<TimelineEventType>>(new Set());

  protected readonly allChannels: TimelineChannel[] = ['telephone', 'sms', 'email', 'lettre', 'reunion'];
  protected readonly allTypes: TimelineEventType[] = ['action', 'promesse', 'echeancier', 'note'];

  protected readonly channelLabels = CHANNEL_LABELS;
  protected readonly typeLabels = TYPE_LABELS;

  protected readonly filteredEvents = computed<TimelineEvent[]>(() => {
    const channels = this.activeChannels();
    const types = this.activeTypes();
    return this.events().filter((e) => {
      const channelOk = channels.size === 0 || channels.has(e.channel);
      const typeOk = types.size === 0 || types.has(e.type);
      return channelOk && typeOk;
    });
  });

  protected toggleChannel(channel: TimelineChannel): void {
    this.activeChannels.update((s) => {
      const next = new Set(s);
      if (next.has(channel)) {
        next.delete(channel);
      } else {
        next.add(channel);
      }
      return next;
    });
  }

  protected toggleType(type: TimelineEventType): void {
    this.activeTypes.update((s) => {
      const next = new Set(s);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  protected isChannelActive(channel: TimelineChannel): boolean {
    return this.activeChannels().has(channel);
  }

  protected isTypeActive(type: TimelineEventType): boolean {
    return this.activeTypes().has(type);
  }

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected channelClass(channel: TimelineChannel): string {
    return `timeline__dot timeline__dot--${channel}`;
  }

  protected eventAriaLabel(event: TimelineEvent): string {
    return `${this.formatDate(event.date)} — ${CHANNEL_LABELS[event.channel]} — ${TYPE_LABELS[event.type]} : ${event.description}`;
  }

  protected formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
}
