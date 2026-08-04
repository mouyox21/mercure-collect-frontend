import { Component, inject } from '@angular/core';
import { PermissionService } from './permission.service';
import { RoleProfile } from './permission.types';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'mc-permission-debug',
  standalone: true,
  template: `
    @if (visible) {
      <div class="perm-debug" role="toolbar" aria-label="Sélecteur de profil (debug)">
        <span class="perm-debug__label">Profil :</span>
        @for (p of profiles; track p) {
          <button
            class="perm-debug__btn"
            [class.perm-debug__btn--active]="svc.currentProfile() === p"
            type="button"
            (click)="svc.setProfile(p)"
          >{{ p }}</button>
        }
      </div>
    }
  `,
  styles: [`
    .perm-debug {
      position: fixed;
      bottom: 16px;
      right: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #1e293b;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,.4);
      z-index: 9999;
      font-family: monospace;
      font-size: 12px;
    }

    .perm-debug__label {
      color: #94a3b8;
    }

    .perm-debug__btn {
      padding: 3px 10px;
      border: 1px solid #475569;
      border-radius: 4px;
      background: transparent;
      color: #cbd5e1;
      cursor: pointer;
      font-family: inherit;
      font-size: inherit;
      transition: background 0.15s, color 0.15s;

      &:hover { background: #334155; }

      &--active {
        background: #2563eb;
        border-color: #2563eb;
        color: #fff;
      }
    }
  `],
})
export class PermissionDebugComponent {
  protected readonly svc      = inject(PermissionService);
  protected readonly profiles: RoleProfile[] = ['agent', 'superviseur', 'administrateur'];
  protected readonly visible  = !environment.production;
}
