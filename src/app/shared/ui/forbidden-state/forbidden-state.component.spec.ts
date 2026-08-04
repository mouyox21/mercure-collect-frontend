import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ForbiddenStateComponent } from './forbidden-state.component';

describe('ForbiddenStateComponent', () => {
  let fixture: ComponentFixture<ForbiddenStateComponent>;

  function create(message?: string): void {
    fixture = TestBed.createComponent(ForbiddenStateComponent);
    if (message !== undefined) fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
  }

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenStateComponent],
    }).compileComponents();
  });

  it('should display the default message', () => {
    create();
    expect(host().querySelector('.forbidden-state__message')?.textContent?.trim())
      .toContain('droits nécessaires');
  });

  it('should display a custom message', () => {
    create('Section réservée aux administrateurs.');
    expect(host().querySelector('.forbidden-state__message')?.textContent?.trim())
      .toBe('Section réservée aux administrateurs.');
  });

  it('should display the title "Accès refusé"', () => {
    create();
    expect(host().querySelector('.forbidden-state__title')?.textContent?.trim())
      .toBe('Accès refusé');
  });

  it('should have role="alert"', () => {
    create();
    expect(host().querySelector('[role="alert"]')).toBeTruthy();
  });
});
