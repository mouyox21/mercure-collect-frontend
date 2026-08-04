import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../data-access/permission.service';
import { PermissionCode } from '../data-access/permission.types';

/**
 * Protects routes that require a specific permission code.
 * Add `data: { requiredRight: 'PERMISSION_CODE' }` to the route definition.
 * Redirects to /dashboard when the active role lacks the required right.
 */
export const roleGuard: CanActivateFn = (route) => {
  const permissions = inject(PermissionService);
  const router      = inject(Router);
  const required    = route.data['requiredRight'] as PermissionCode | undefined;

  if (!required || permissions.hasRight(required)) return true;

  return router.createUrlTree(['/dashboard']);
};
