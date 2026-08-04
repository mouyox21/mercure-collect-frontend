import { TestBed, ComponentFixture } from '@angular/core/testing';
import { TimelineComponent } from './timeline.component';
import { TimelineEvent } from '../ui.types';

const MOCK_EVENTS: TimelineEvent[] = [
  {
    id: 'e-001',
    date: new Date('2025-01-10T09:00:00'),
    channel: 'telephone',
    type: 'action',
    description: 'Appel sans réponse.',
    agent: 'A. Martin',
  },
  {
    id: 'e-002',
    date: new Date('2025-01-12T14:30:00'),
    channel: 'email',
    type: 'promesse',
    description: 'Promesse de paiement reçue par e-mail.',
    agent: 'A. Martin',
    amount: 5000,
  },
  {
    id: 'e-003',
    date: new Date('2025-01-14T10:00:00'),
    channel: 'sms',
    type: 'note',
    description: 'Rappel SMS envoyé.',
  },
];

describe('TimelineComponent', () => {
  let fixture: ComponentFixture<TimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TimelineComponent);
    fixture.componentRef.setInput('events', MOCK_EVENTS);
    fixture.detectChanges();
  });

  it('should render all events when no filter is active', () => {
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.timeline__event');
    expect(items.length).toBe(3);
  });

  it('should filter events by channel', () => {
    const btns = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.timeline__filter-btn');
    // First button group is channels: telephone, sms, email, lettre, reunion
    btns[0].click(); // telephone
    fixture.detectChanges();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.timeline__event');
    expect(items.length).toBe(1);
  });

  it('should filter events by type', () => {
    const btns = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.timeline__filter-btn');
    // Type buttons start at index 5 (after 5 channel buttons)
    btns[6].click(); // promesse type
    fixture.detectChanges();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.timeline__event');
    expect(items.length).toBe(1);
  });

  it('should show empty state when filters exclude all events', () => {
    const btns = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.timeline__filter-btn');
    btns[3].click(); // lettre channel (no events have this channel)
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.timeline__empty')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.timeline__event').length).toBe(0);
  });

  it('should display dot with correct channel class', () => {
    const dots = (fixture.nativeElement as HTMLElement).querySelectorAll('.timeline__dot');
    expect(dots[0]?.classList.contains('timeline__dot--telephone')).toBe(true);
    expect(dots[1]?.classList.contains('timeline__dot--email')).toBe(true);
  });

  it('should toggle filter off on second click', () => {
    const btn = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.timeline__filter-btn')[0];
    btn.click();
    fixture.detectChanges();
    btn.click();
    fixture.detectChanges();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.timeline__event');
    expect(items.length).toBe(3);
  });
});
