import { Injectable, computed, signal } from '@angular/core';
import { Creditor, CreditorService } from '../creditor.service';

const MOCK: readonly Creditor[] = [
  { id: 'c1', name: 'Banque Nationale de Paris', code: 'BNP' },
  { id: 'c2', name: 'Crédit Agricole',           code: 'CA'  },
  { id: 'c3', name: 'Société Générale',           code: 'SG'  },
  { id: 'c4', name: 'La Banque Postale',          code: 'LBP' },
];

@Injectable()
export class MockCreditorService extends CreditorService {
  private readonly _all    = signal<readonly Creditor[]>(MOCK);
  private readonly _active = signal<string>(MOCK[0].id);

  readonly creditors = this._all.asReadonly();
  readonly active    = computed(() => this._all().find(c => c.id === this._active()) ?? null);

  select(id: string): void { this._active.set(id); }
}
