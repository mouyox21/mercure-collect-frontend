import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { BreadcrumbComponent } from './breadcrumb.component';

@Component({ selector: 'mc-dummy', standalone: true, template: '' })
class DummyComponent {}

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<BreadcrumbComponent>;
  let router: Router;

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [
        provideRouter([
          {
            path: '',
            component: BreadcrumbComponent,
            children: [
              {
                path: 'dossiers',
                component: DummyComponent,
                data: { breadcrumb: 'Dossiers' },
              },
              {
                path: 'clients',
                component: DummyComponent,
                data: { breadcrumb: 'Clients' },
              },
            ],
          },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(BreadcrumbComponent);
    fixture.detectChanges();
  });

  it('should not render when at root with no breadcrumb', () => {
    expect(host().querySelector('.breadcrumb')).toBeFalsy();
  });

  it('should render nav with "Accueil" when navigating to a breadcrumb route', async () => {
    await router.navigate(['/dossiers']);
    fixture.detectChanges();
    expect(host().querySelector('.breadcrumb')).toBeTruthy();
    expect(host().querySelector('.breadcrumb__link')?.textContent?.trim()).toBe('Accueil');
  });

  it('should show the current page label', async () => {
    await router.navigate(['/dossiers']);
    fixture.detectChanges();
    expect(host().querySelector('.breadcrumb__current')?.textContent?.trim()).toBe('Dossiers');
  });

  it('should update breadcrumb on route change', async () => {
    await router.navigate(['/dossiers']);
    fixture.detectChanges();
    expect(host().querySelector('.breadcrumb__current')?.textContent?.trim()).toBe('Dossiers');

    await router.navigate(['/clients']);
    fixture.detectChanges();
    expect(host().querySelector('.breadcrumb__current')?.textContent?.trim()).toBe('Clients');
  });

  it('should mark the current page with aria-current="page"', async () => {
    await router.navigate(['/dossiers']);
    fixture.detectChanges();
    const items = host().querySelectorAll('.breadcrumb__item');
    const last  = items[items.length - 1];
    expect(last.getAttribute('aria-current')).toBe('page');
  });
});
