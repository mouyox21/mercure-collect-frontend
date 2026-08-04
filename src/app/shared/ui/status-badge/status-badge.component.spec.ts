import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
import { StatusValue } from '../ui.types';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  const cases: Array<{ status: StatusValue; expectedLabel: string; expectedClass: string }> = [
    { status: 'nouveau',        expectedLabel: 'Nouveau',        expectedClass: 'status-badge--nouveau' },
    { status: 'en-cours',       expectedLabel: 'En cours',       expectedClass: 'status-badge--en-cours' },
    { status: 'promesse',       expectedLabel: 'Promesse',        expectedClass: 'status-badge--promesse' },
    { status: 'echeancier',     expectedLabel: 'Échéancier',     expectedClass: 'status-badge--echeancier' },
    { status: 'precontentieux', expectedLabel: 'Pré-contentieux', expectedClass: 'status-badge--precontentieux' },
    { status: 'contentieux',    expectedLabel: 'Contentieux',    expectedClass: 'status-badge--contentieux' },
    { status: 'cloture',        expectedLabel: 'Clôturé',        expectedClass: 'status-badge--cloture' },
  ];

  cases.forEach(({ status, expectedLabel, expectedClass }) => {
    it(`should render ${status} with correct label and class`, () => {
      fixture.componentRef.setInput('status', status);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const badge = el.querySelector('.status-badge');
      expect(badge?.textContent?.trim()).toBe(expectedLabel);
      expect(badge?.classList.contains(expectedClass)).toBe(true);
    });
  });

  it('should have role="status" for screen readers', () => {
    fixture.componentRef.setInput('status', 'nouveau');
    fixture.detectChanges();
    const badge = (fixture.nativeElement as HTMLElement).querySelector('.status-badge');
    expect(badge?.getAttribute('role')).toBe('status');
  });
});
