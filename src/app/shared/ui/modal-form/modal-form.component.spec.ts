import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ModalFormComponent } from './modal-form.component';
import { ModalFormValue, ModalUsage } from '../ui.types';

describe('ModalFormComponent', () => {
  let fixture: ComponentFixture<ModalFormComponent>;

  function createComponent(usage: ModalUsage, open: boolean): void {
    fixture = TestBed.createComponent(ModalFormComponent);
    fixture.componentRef.setInput('usage', usage);
    fixture.componentRef.setInput('open', open);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalFormComponent, ReactiveFormsModule],
    }).compileComponents();
  });

  it('should render dialog when open', () => {
    createComponent('action', true);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('should not render dialog when closed', () => {
    createComponent('action', false);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
  });

  it('should display correct title for action usage', () => {
    createComponent('action', true);
    expect((fixture.nativeElement as HTMLElement).querySelector('.modal__title')?.textContent?.trim()).toBe('Enregistrer une action');
  });

  it('should display correct title for promesse usage', () => {
    createComponent('promesse', true);
    expect((fixture.nativeElement as HTMLElement).querySelector('.modal__title')?.textContent?.trim()).toBe('Enregistrer une promesse');
  });

  it('should display correct title for escalade usage', () => {
    createComponent('escalade', true);
    expect((fixture.nativeElement as HTMLElement).querySelector('.modal__title')?.textContent?.trim()).toBe('Escalader le dossier');
  });

  it('should emit closed when close button is clicked', () => {
    createComponent('action', true);
    let emitted = false;
    fixture.componentInstance.closed.subscribe(() => (emitted = true));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.modal__close')?.click();
    expect(emitted).toBe(true);
  });

  it('should not submit when required commentaire is empty (action usage)', () => {
    createComponent('action', true);
    let emitted = false;
    fixture.componentInstance.submitted.subscribe(() => (emitted = true));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.modal__btn--primary')?.click();
    fixture.detectChanges();
    expect(emitted).toBe(false);
  });

  it('should show error when commentaire is touched and empty', () => {
    createComponent('action', true);
    fixture.componentInstance.form.get('commentaire')?.markAsTouched();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.modal__error')).toBeTruthy();
  });

  it('should emit submitted with form value on valid submit', () => {
    createComponent('action', true);
    let emitted: ModalFormValue | undefined;
    fixture.componentInstance.submitted.subscribe((v: ModalFormValue) => (emitted = v));

    fixture.componentInstance.form.setValue({
      canal: 'Téléphone',
      commentaire: 'Appel effectué.',
      motif: '',
      date: '',
      montant: null,
    });
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.modal__btn--primary')?.click();
    fixture.detectChanges();

    expect(emitted).toBeDefined();
    expect(emitted?.commentaire).toBe('Appel effectué.');
  });

  it('should show date and amount fields for promesse usage', () => {
    createComponent('promesse', true);
    expect((fixture.nativeElement as HTMLElement).querySelector('#date')).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('#montant')).toBeTruthy();
  });

  it('should show canal field for action usage', () => {
    createComponent('action', true);
    expect((fixture.nativeElement as HTMLElement).querySelector('#canal')).toBeTruthy();
  });
});
