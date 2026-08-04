import { Component, computed, input } from '@angular/core';

export type SkeletonVariant = 'list' | 'card' | 'table';

@Component({
  selector: 'mc-skeleton-loader',
  standalone: true,
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.scss',
})
export class SkeletonLoaderComponent {
  readonly rows    = input<number>(3);
  readonly variant = input<SkeletonVariant>('list');

  protected readonly skeletonRows  = computed(() => Array.from({ length: this.rows() }));
  protected readonly containerClass = computed(() => `skeleton skeleton--${this.variant()}`);
}
