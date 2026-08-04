import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SkeletonLoaderComponent } from './skeleton-loader.component';

describe('SkeletonLoaderComponent', () => {
  let fixture: ComponentFixture<SkeletonLoaderComponent>;

  function create(rows?: number, variant?: 'list' | 'card' | 'table'): void {
    fixture = TestBed.createComponent(SkeletonLoaderComponent);
    if (rows    !== undefined) fixture.componentRef.setInput('rows',    rows);
    if (variant !== undefined) fixture.componentRef.setInput('variant', variant);
    fixture.detectChanges();
  }

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonLoaderComponent],
    }).compileComponents();
  });

  it('should render 3 rows by default', () => {
    create();
    expect(host().querySelectorAll('.skeleton__row').length).toBe(3);
  });

  it('should render N rows when rows input is set', () => {
    create(5);
    expect(host().querySelectorAll('.skeleton__row').length).toBe(5);
  });

  it('should apply list variant class by default', () => {
    create();
    expect(host().querySelector('.skeleton--list')).toBeTruthy();
  });

  it('should apply card variant class', () => {
    create(2, 'card');
    expect(host().querySelector('.skeleton--card')).toBeTruthy();
  });

  it('should apply table variant class', () => {
    create(2, 'table');
    expect(host().querySelector('.skeleton--table')).toBeTruthy();
  });

  it('should have aria-busy="true"', () => {
    create();
    expect(host().querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it('should render list lines in list variant', () => {
    create(2, 'list');
    expect(host().querySelectorAll('.skeleton__line').length).toBeGreaterThan(0);
  });

  it('should render card blocks in card variant', () => {
    create(2, 'card');
    expect(host().querySelectorAll('.skeleton__block').length).toBeGreaterThan(0);
  });

  it('should render table cells in table variant', () => {
    create(2, 'table');
    expect(host().querySelectorAll('.skeleton__cell').length).toBeGreaterThan(0);
  });
});
