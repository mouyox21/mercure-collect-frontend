import { TestBed, ComponentFixture } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;

  function create(message: string, actionLabel?: string): void {
    fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('message', message);
    if (actionLabel !== undefined) fixture.componentRef.setInput('actionLabel', actionLabel);
    fixture.detectChanges();
  }

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();
  });

  it('should display the provided message', () => {
    create('Aucun dossier trouvé');
    expect(host().querySelector('.empty-state__message')?.textContent?.trim()).toBe('Aucun dossier trouvé');
  });

  it('should have role="status"', () => {
    create('Aucun résultat');
    expect(host().querySelector('[role="status"]')).toBeTruthy();
  });

  it('should not render action button when actionLabel is not provided', () => {
    create('Aucun dossier');
    expect(host().querySelector('.empty-state__btn')).toBeNull();
  });

  it('should render action button when actionLabel is provided', () => {
    create('Aucun dossier', 'Créer un dossier');
    const btn = host().querySelector<HTMLButtonElement>('.empty-state__btn');
    expect(btn).toBeTruthy();
    expect(btn?.textContent?.trim()).toBe('Créer un dossier');
  });

  it('should emit action when action button is clicked', () => {
    create('Aucun dossier', 'Créer un dossier');
    let emitted = false;
    fixture.componentInstance.action.subscribe(() => (emitted = true));
    host().querySelector<HTMLButtonElement>('.empty-state__btn')?.click();
    expect(emitted).toBe(true);
  });
});
