import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CaseCardComponent } from './case-card.component';
import { CaseData } from '../ui.types';

const MOCK_CASE: CaseData = {
  id: 'c-001',
  debtorName: 'Dupont SAS',
  amount: 12500,
  daysOverdue: 45,
  status: 'en-cours',
  lastContact: new Date('2025-01-15'),
  agent: 'Marie Curie',
};

describe('CaseCardComponent', () => {
  let fixture: ComponentFixture<CaseCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CaseCardComponent);
  });

  it('should render debtor name', () => {
    fixture.componentRef.setInput('case', MOCK_CASE);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.case-card__name')?.textContent?.trim()).toBe('Dupont SAS');
  });

  it('should apply variant class', () => {
    fixture.componentRef.setInput('case', MOCK_CASE);
    fixture.componentRef.setInput('variant', 'critical');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.case-card--critical')).toBeTruthy();
  });

  it('should display agent name', () => {
    fixture.componentRef.setInput('case', MOCK_CASE);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.case-card__agent')?.textContent?.trim()).toBe('Marie Curie');
  });

  it('should emit selected on click', () => {
    fixture.componentRef.setInput('case', MOCK_CASE);
    fixture.detectChanges();
    let emitted: CaseData | undefined;
    fixture.componentInstance.selected.subscribe((v: CaseData) => (emitted = v));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.case-card')?.click();
    expect(emitted).toEqual(MOCK_CASE);
  });

  it('should be keyboard-activatable via Enter', () => {
    fixture.componentRef.setInput('case', MOCK_CASE);
    fixture.detectChanges();
    let emitted: CaseData | undefined;
    fixture.componentInstance.selected.subscribe((v: CaseData) => (emitted = v));
    const card = fixture.nativeElement.querySelector('.case-card') as HTMLElement;
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(emitted).toEqual(MOCK_CASE);
  });
});
