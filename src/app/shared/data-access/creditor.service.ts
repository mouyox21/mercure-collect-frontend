import { Injectable, Signal } from '@angular/core';

export interface Creditor {
  readonly id: string;
  readonly name: string;
  readonly code: string;
}

@Injectable()
export abstract class CreditorService {
  abstract readonly creditors: Signal<readonly Creditor[]>;
  abstract readonly active: Signal<Creditor | null>;
  abstract select(id: string): void;
}
