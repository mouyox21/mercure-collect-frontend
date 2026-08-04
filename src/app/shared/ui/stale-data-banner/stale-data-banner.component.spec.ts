import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StaleDataBannerComponent } from './stale-data-banner.component';

describe('StaleDataBannerComponent', () => {
  let fixture: ComponentFixture<StaleDataBannerComponent>;

  function create(message?: string): void {
    fixture = TestBed.createComponent(StaleDataBannerComponent);
    if (message !== undefined) fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
  }

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaleDataBannerComponent],
    }).compileComponents();
  });

  it('should display the default message', () => {
    create();
    expect(host().querySelector('.stale-banner__message')?.textContent?.trim())
      .toContain('à jour');
  });

  it('should display a custom message', () => {
    create('Synchronisation en cours…');
    expect(host().querySelector('.stale-banner__message')?.textContent?.trim())
      .toBe('Synchronisation en cours…');
  });

  it('should have role="alert"', () => {
    create();
    expect(host().querySelector('[role="alert"]')).toBeTruthy();
  });

  it('should render a refresh button', () => {
    create();
    expect(host().querySelector<HTMLButtonElement>('.stale-banner__btn')?.textContent?.trim())
      .toBe('Actualiser');
  });

  it('should emit refresh when button is clicked', () => {
    create();
    let emitted = false;
    fixture.componentInstance.refresh.subscribe(() => (emitted = true));
    host().querySelector<HTMLButtonElement>('.stale-banner__btn')?.click();
    expect(emitted).toBe(true);
  });
});
