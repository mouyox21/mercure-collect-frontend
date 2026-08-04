import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';

interface BreadcrumbItem {
  readonly label: string;
  readonly route: string | null;
}

@Component({
  selector: 'mc-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);

  protected readonly breadcrumbs = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.build()),
    ),
    { initialValue: [] as BreadcrumbItem[] },
  );

  private build(): BreadcrumbItem[] {
    const result: BreadcrumbItem[] = [];
    let current: ActivatedRoute | null = this.route.root;

    while (current) {
      const primary: ActivatedRoute | undefined =
        current.children.find(c => c.outlet === 'primary') ?? current.children[0];
      if (!primary) break;

      const segments: string[] = primary.snapshot.url.map(s => s.path);
      if (segments.length) {
        const url    = '/' + segments.join('/');
        const label  = primary.snapshot.data['breadcrumb'] as string | undefined;
        if (label) result.push({ label, route: url });
      }
      current = primary;
    }

    if (result.length > 0) {
      result[result.length - 1] = { ...result[result.length - 1], route: null };
    }
    return result;
  }
}
