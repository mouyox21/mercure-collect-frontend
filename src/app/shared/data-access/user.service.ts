import { Injectable, Signal } from '@angular/core';

export interface CurrentUser {
  readonly name: string;
  readonly initials: string;
}

@Injectable()
export abstract class UserService {
  abstract readonly currentUser: Signal<CurrentUser>;
}
