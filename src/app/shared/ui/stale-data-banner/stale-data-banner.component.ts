import { Component, input, output } from '@angular/core';

@Component({
  selector: 'mc-stale-data-banner',
  standalone: true,
  templateUrl: './stale-data-banner.component.html',
  styleUrl: './stale-data-banner.component.scss',
})
export class StaleDataBannerComponent {
  readonly message = input<string>('Les données affichées peuvent ne pas être à jour.');

  readonly refresh = output<void>();
}
