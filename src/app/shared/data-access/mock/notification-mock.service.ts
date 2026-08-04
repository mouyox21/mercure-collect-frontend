import { Injectable, computed, signal } from '@angular/core';
import { NotificationItem, NotificationService } from '../notification.service';

const now = new Date();
const d = (ms: number) => new Date(now.getTime() + ms);

const MOCK: readonly NotificationItem[] = [
  { id: 'n1', category: 'overdue',       title: 'Action en retard',       description: 'Appel client Dupont – 3 jours de retard',          date: d(-3 * 86_400_000), severity: 'critical' },
  { id: 'n2', category: 'overdue',       title: 'Action en retard',       description: 'Relance client Martin – 1 jour de retard',         date: d(-86_400_000),     severity: 'warning'  },
  { id: 'n3', category: 'promise',       title: 'Promesse du jour',       description: 'Paiement 450 € attendu – client Lefebvre',         date: now,                severity: 'normal'   },
  { id: 'n4', category: 'promise',       title: 'Promesse du jour',       description: 'Virement 1 200 € attendu – client Moreau',         date: now,                severity: 'normal'   },
  { id: 'n5', category: 'validation',    title: 'Validation superviseur', description: "Échéancier 3 × 300 € en attente d'approbation",   date: now,                severity: 'warning'  },
  { id: 'n6', category: 'import-error',  title: "Erreur d'import",        description: 'Fichier BNP_20260801.csv – 3 lignes rejetées',     date: d(-3_600_000),      severity: 'critical' },
];

@Injectable()
export class MockNotificationService extends NotificationService {
  private readonly _items   = signal<readonly NotificationItem[]>(MOCK);
  private readonly _readIds = signal<ReadonlySet<string>>(new Set<string>());

  readonly notifications = this._items.asReadonly();
  readonly unreadCount   = computed(() => {
    const read = this._readIds();
    return this._items().filter(n => !read.has(n.id)).length;
  });

  markAllRead(): void {
    this._readIds.set(new Set(this._items().map(n => n.id)));
  }
}
