import { Component, computed, inject, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationItem, NotificationService } from '../../shared/data-access/notification.service';

interface CategoryGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly NotificationItem[];
}

const CATEGORIES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'overdue',       label: 'Actions en retard'       },
  { id: 'promise',       label: 'Promesses du jour'       },
  { id: 'validation',    label: 'Validations superviseur' },
  { id: 'import-error',  label: "Erreurs d'import"        },
];

@Component({
  selector: 'mc-notification-center',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
})
export class NotificationCenterComponent {
  private readonly notifs = inject(NotificationService);

  readonly closed = output<void>();

  protected readonly groups = computed<CategoryGroup[]>(() => {
    const items = this.notifs.notifications();
    return CATEGORIES
      .map(c => ({ id: c.id, label: c.label, items: items.filter(n => n.category === c.id) }))
      .filter(g => g.items.length > 0);
  });

  protected readonly unreadCount = this.notifs.unreadCount;

  protected markAllRead(): void { this.notifs.markAllRead(); }
}
