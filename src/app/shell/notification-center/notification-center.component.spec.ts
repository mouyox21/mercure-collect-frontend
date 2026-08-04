import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NotificationCenterComponent } from './notification-center.component';
import { NotificationService } from '../../shared/data-access/notification.service';
import { MockNotificationService } from '../../shared/data-access/mock/notification-mock.service';

describe('NotificationCenterComponent', () => {
  let fixture: ComponentFixture<NotificationCenterComponent>;
  let notifSvc: MockNotificationService;

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationCenterComponent],
      providers: [
        { provide: NotificationService, useClass: MockNotificationService },
      ],
    }).compileComponents();

    notifSvc = TestBed.inject(NotificationService) as MockNotificationService;
    fixture  = TestBed.createComponent(NotificationCenterComponent);
    fixture.detectChanges();
  });

  it('should render a panel with a title', () => {
    expect(host().querySelector('.notif-panel__title')?.textContent?.trim()).toBe('Notifications');
  });

  it('should display all 4 notification categories', () => {
    const labels = [...host().querySelectorAll('.notif-group__label')].map(el => el.textContent?.trim());
    expect(labels).toContain('Actions en retard');
    expect(labels).toContain('Promesses du jour');
    expect(labels).toContain('Validations superviseur');
    expect(labels).toContain("Erreurs d'import");
  });

  it('should render 6 notification items total', () => {
    const items = host().querySelectorAll('.notif-item');
    expect(items.length).toBe(6);
  });

  it('should show "Tout marquer lu" button when there are unread notifications', () => {
    expect(host().querySelector('.notif-panel__read-all')).toBeTruthy();
  });

  it('should hide "Tout marquer lu" after markAllRead', () => {
    notifSvc.markAllRead();
    fixture.detectChanges();
    expect(host().querySelector('.notif-panel__read-all')).toBeFalsy();
  });

  it('should emit closed when close button is clicked', () => {
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    host().querySelector<HTMLButtonElement>('.notif-panel__close')?.click();
    expect(closed).toBe(true);
  });

  it('should apply severity class to items', () => {
    expect(host().querySelector('.notif-item--critical')).toBeTruthy();
    expect(host().querySelector('.notif-item--warning')).toBeTruthy();
    expect(host().querySelector('.notif-item--normal')).toBeTruthy();
  });
});
