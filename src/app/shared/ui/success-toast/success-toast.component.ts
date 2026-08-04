import { Component, OnDestroy, OnInit, input, output } from '@angular/core';

@Component({
  selector: 'mc-success-toast',
  standalone: true,
  templateUrl: './success-toast.component.html',
  styleUrl: './success-toast.component.scss',
})
export class SuccessToastComponent implements OnInit, OnDestroy {
  readonly message  = input.required<string>();
  readonly duration = input<number>(3000);

  readonly dismissed = output<void>();

  private timerId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.timerId = setTimeout(() => this.dismiss(), this.duration());
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) clearTimeout(this.timerId);
  }

  protected dismiss(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.dismissed.emit();
  }
}
