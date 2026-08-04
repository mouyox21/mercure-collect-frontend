import { TestBed, ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';
import { SuccessToastComponent } from './success-toast.component';

describe('SuccessToastComponent', () => {
  let fixture: ComponentFixture<SuccessToastComponent>;

  function create(message: string, duration?: number): void {
    fixture = TestBed.createComponent(SuccessToastComponent);
    fixture.componentRef.setInput('message', message);
    if (duration !== undefined) fixture.componentRef.setInput('duration', duration);
    fixture.detectChanges();
  }

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [SuccessToastComponent],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    fixture?.destroy();
  });

  it('should display the message', () => {
    create('Dossier enregistré avec succès.');
    expect(host().querySelector('.success-toast__message')?.textContent?.trim())
      .toBe('Dossier enregistré avec succès.');
  });

  it('should have role="status"', () => {
    create('OK');
    expect(host().querySelector('[role="status"]')).toBeTruthy();
  });

  it('should render a close button', () => {
    create('OK');
    expect(host().querySelector('.success-toast__close')).toBeTruthy();
  });

  it('should emit dismissed after the configured duration', () => {
    create('Succès !', 1500);
    let dismissed = false;
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));

    vi.advanceTimersByTime(1500);
    expect(dismissed).toBe(true);
  });

  it('should not emit dismissed before the duration elapses', () => {
    create('Succès !', 2000);
    let dismissed = false;
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));

    vi.advanceTimersByTime(999);
    expect(dismissed).toBe(false);
  });

  it('should emit dismissed when close button is clicked', () => {
    create('OK');
    let dismissed = false;
    fixture.componentInstance.dismissed.subscribe(() => (dismissed = true));

    host().querySelector<HTMLButtonElement>('.success-toast__close')?.click();
    expect(dismissed).toBe(true);
  });

  it('should not emit dismissed twice when close clicked before timer fires', () => {
    create('OK', 2000);
    let count = 0;
    fixture.componentInstance.dismissed.subscribe(() => count++);

    host().querySelector<HTMLButtonElement>('.success-toast__close')?.click();
    vi.advanceTimersByTime(2000);
    // timer was cleared on manual dismiss — only one emission
    expect(count).toBe(1);
  });
});
