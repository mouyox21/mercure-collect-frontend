import { TestBed, ComponentFixture } from '@angular/core/testing';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<KpiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(KpiCardComponent);
  });

  it('should render title and value', () => {
    fixture.componentRef.setInput('title', 'Total Créances');
    fixture.componentRef.setInput('value', 150000);
    fixture.componentRef.setInput('variant', 'amount');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.kpi-card__title')?.textContent?.trim()).toBe('Total Créances');
  });

  it('should apply variant modifier class', () => {
    fixture.componentRef.setInput('title', 'KPI');
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('variant', 'critical');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.kpi-card--critical')).toBeTruthy();
  });

  it('should show positive delta with correct class', () => {
    fixture.componentRef.setInput('title', 'KPI');
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('delta', 5);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.kpi-card__delta--positive')).toBeTruthy();
  });

  it('should show negative delta with correct class', () => {
    fixture.componentRef.setInput('title', 'KPI');
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('delta', -3);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.kpi-card__delta--negative')).toBeTruthy();
  });

  it('should format amount with currency', () => {
    fixture.componentRef.setInput('title', 'Total');
    fixture.componentRef.setInput('value', 1500);
    fixture.componentRef.setInput('variant', 'amount');
    fixture.detectChanges();
    const value = (fixture.nativeElement as HTMLElement).querySelector('.kpi-card__value')?.textContent ?? '';
    expect(value).toContain('1');
    expect(value).toContain('500');
  });

  it('should render subtitle when provided', () => {
    fixture.componentRef.setInput('title', 'KPI');
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('subtitle', 'vs mois dernier');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.kpi-card__subtitle')?.textContent?.trim()).toBe('vs mois dernier');
  });
});
