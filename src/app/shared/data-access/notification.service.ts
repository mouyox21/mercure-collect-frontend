import { Injectable, Signal } from '@angular/core';

export type NotificationCategory = 'overdue' | 'promise' | 'validation' | 'import-error';
export type NotificationSeverity = 'normal' | 'warning' | 'critical';

export interface NotificationItem {
  readonly id: string;
  readonly category: NotificationCategory;
  readonly title: string;
  readonly description: string;
  readonly date: Date;
  readonly severity: NotificationSeverity;
}

@Injectable()
export abstract class NotificationService {
  abstract readonly notifications: Signal<readonly NotificationItem[]>;
  abstract readonly unreadCount: Signal<number>;
  abstract markAllRead(): void;
}
