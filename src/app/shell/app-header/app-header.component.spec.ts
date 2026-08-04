import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppHeaderComponent } from './app-header.component';
import { PermissionService } from '../../shared/data-access/permission.service';
import { MockPermissionService } from '../../shared/data-access/mock/permission-mock.service';
import { UserService } from '../../shared/data-access/user.service';
import { MockUserService } from '../../shared/data-access/mock/user-mock.service';
import { CreditorService } from '../../shared/data-access/creditor.service';
import { MockCreditorService } from '../../shared/data-access/mock/creditor-mock.service';
import { NotificationService } from '../../shared/data-access/notification.service';
import { MockNotificationService } from '../../shared/data-access/mock/notification-mock.service';

describe('AppHeaderComponent', () => {
  let fixture: ComponentFixture<AppHeaderComponent>;
  let creditorSvc: MockCreditorService;
  let notifSvc: MockNotificationService;

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: PermissionService,   useClass: MockPermissionService   },
        { provide: UserService,         useClass: MockUserService         },
        { provide: CreditorService,     useClass: MockCreditorService     },
        { provide: NotificationService, useClass: MockNotificationService },
      ],
    }).compileComponents();

    creditorSvc = TestBed.inject(CreditorService) as MockCreditorService;
    notifSvc    = TestBed.inject(NotificationService) as MockNotificationService;

    fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();
  });

  it('should display the active creditor name', () => {
    expect(host().querySelector('.header__creditor-name')?.textContent?.trim())
      .toBe('Banque Nationale de Paris');
  });

  it('should show the agent name', () => {
    expect(host().querySelector('.header__agent-name')?.textContent?.trim()).toBe('Marie Dupont');
  });

  it('should show the agent initials', () => {
    expect(host().querySelector('.header__agent-avatar')?.textContent?.trim()).toBe('MD');
  });

  it('should show unread notification badge', () => {
    expect(host().querySelector('.header__notif-badge')).toBeTruthy();
  });

  it('should hide badge after markAllRead', async () => {
    notifSvc.markAllRead();
    fixture.detectChanges();
    expect(host().querySelector('.header__notif-badge')).toBeFalsy();
  });

  it('should open creditor dropdown when button is clicked', () => {
    host().querySelector<HTMLButtonElement>('.header__creditor-btn')?.click();
    fixture.detectChanges();
    expect(host().querySelector('.header__creditor-list')).toBeTruthy();
  });

  it('should list all creditors in dropdown', () => {
    host().querySelector<HTMLButtonElement>('.header__creditor-btn')?.click();
    fixture.detectChanges();
    const items = host().querySelectorAll('.header__creditor-item');
    expect(items.length).toBe(4);
  });

  it('should change active creditor when item is clicked', () => {
    host().querySelector<HTMLButtonElement>('.header__creditor-btn')?.click();
    fixture.detectChanges();
    const items = host().querySelectorAll<HTMLElement>('.header__creditor-item');
    items[1].click();
    fixture.detectChanges();
    expect(host().querySelector('.header__creditor-name')?.textContent?.trim()).toBe('Crédit Agricole');
  });

  it('should close creditor dropdown after selection', () => {
    host().querySelector<HTMLButtonElement>('.header__creditor-btn')?.click();
    fixture.detectChanges();
    const items = host().querySelectorAll<HTMLElement>('.header__creditor-item');
    items[0].click();
    fixture.detectChanges();
    expect(host().querySelector('.header__creditor-list')).toBeFalsy();
  });

  it('should toggle notification center when bell is clicked', () => {
    expect(host().querySelector('mc-notification-center')).toBeFalsy();
    host().querySelector<HTMLButtonElement>('.header__notif-btn')?.click();
    fixture.detectChanges();
    expect(host().querySelector('mc-notification-center')).toBeTruthy();
  });

  it('should close notification center when bell is clicked again', () => {
    host().querySelector<HTMLButtonElement>('.header__notif-btn')?.click();
    fixture.detectChanges();
    host().querySelector<HTMLButtonElement>('.header__notif-btn')?.click();
    fixture.detectChanges();
    expect(host().querySelector('mc-notification-center')).toBeFalsy();
  });

  it('should render a search input', () => {
    expect(host().querySelector('.header__search-input')).toBeTruthy();
  });
});
