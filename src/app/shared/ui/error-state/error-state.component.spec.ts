import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;

  function create(overrides: { message?: string; errorCode?: string } = {}): void {
    fixture = TestBed.createComponent(ErrorStateComponent);
    if (overrides.message   !== undefined) fixture.componentRef.setInput('message',   overrides.message);
    if (overrides.errorCode !== undefined) fixture.componentRef.setInput('errorCode', overrides.errorCode);
    fixture.detectChanges();
  }

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent],
    }).compileComponents();
  });

  it('should display the default message', () => {
    create();
    expect(host().querySelector('.error-state__message')?.textContent?.trim())
      .toContain('Une erreur est survenue');
  });

  it('should display a custom message', () => {
    create({ message: 'Impossible de charger les données.' });
    expect(host().querySelector('.error-state__message')?.textContent?.trim())
      .toBe('Impossible de charger les données.');
  });

  it('should have role="alert"', () => {
    create();
    expect(host().querySelector('[role="alert"]')).toBeTruthy();
  });

  it('should render a retry button', () => {
    create();
    expect(host().querySelector<HTMLButtonElement>('.error-state__btn')?.textContent?.trim())
      .toBe('Réessayer');
  });

  it('should emit retry when retry button is clicked', () => {
    create();
    let emitted = false;
    fixture.componentInstance.retry.subscribe(() => (emitted = true));
    host().querySelector<HTMLButtonElement>('.error-state__btn')?.click();
    expect(emitted).toBe(true);
  });

  it('should not expose errorCode in visible text', () => {
    create({ errorCode: 'ERR_500' });
    expect(host().textContent).not.toContain('ERR_500');
  });

  it('should set data-error-code attribute when errorCode is provided', () => {
    create({ errorCode: 'ERR_403' });
    const el = host().querySelector('[data-error-code]');
    expect(el?.getAttribute('data-error-code')).toBe('ERR_403');
  });

  it('should not set data-error-code attribute when errorCode is not provided', () => {
    create();
    expect(host().querySelector('[data-error-code]')).toBeNull();
  });
});
