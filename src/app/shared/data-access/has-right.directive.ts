import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from './permission.service';
import { PermissionCode } from './permission.types';

@Directive({
  selector: '[appHasRight]',
  standalone: true,
})
export class HasRightDirective {
  readonly appHasRight = input.required<PermissionCode>();

  private readonly templateRef       = inject(TemplateRef<unknown>);
  private readonly viewContainer     = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  constructor() {
    effect(() => {
      const allowed = this.permissionService.hasRight(this.appHasRight());
      if (allowed) {
        if (this.viewContainer.length === 0) {
          this.viewContainer.createEmbeddedView(this.templateRef);
        }
      } else {
        this.viewContainer.clear();
      }
    });
  }
}
