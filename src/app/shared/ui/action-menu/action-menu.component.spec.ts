import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActionMenuComponent } from './action-menu.component';
import { ActionType } from '../ui.types';

describe('ActionMenuComponent', () => {
  let fixture: ComponentFixture<ActionMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionMenuComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ActionMenuComponent);
    fixture.detectChanges();
  });

  it('should render trigger button', () => {
    const btn = (fixture.nativeElement as HTMLElement).querySelector('.action-menu__trigger');
    expect(btn).toBeTruthy();
    expect(btn?.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('should be closed by default', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('.action-menu__list')).toBeNull();
  });

  it('should open menu on trigger click', () => {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.action-menu__trigger')?.click();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.action-menu__list')).toBeTruthy();
  });

  it('should close menu on second trigger click', () => {
    const trigger = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.action-menu__trigger')!;
    trigger.click();
    fixture.detectChanges();
    trigger.click();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.action-menu__list')).toBeNull();
  });

  it('should emit actionSelected when an item is clicked', () => {
    let emitted: ActionType | undefined;
    fixture.componentInstance.actionSelected.subscribe((v: ActionType) => (emitted = v));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.action-menu__trigger')?.click();
    fixture.detectChanges();
    const firstItem = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.action-menu__item');
    firstItem?.click();
    fixture.detectChanges();
    expect(emitted).toBeDefined();
  });

  it('should have aria-expanded false when closed', () => {
    const btn = (fixture.nativeElement as HTMLElement).querySelector('.action-menu__trigger');
    expect(btn?.getAttribute('aria-expanded')).toBe('false');
  });

  it('should have aria-expanded true when open', () => {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.action-menu__trigger')?.click();
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector('.action-menu__trigger');
    expect(btn?.getAttribute('aria-expanded')).toBe('true');
  });

  it('should render all 7 default actions', () => {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.action-menu__trigger')?.click();
    fixture.detectChanges();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.action-menu__item');
    expect(items.length).toBe(7);
  });
});
