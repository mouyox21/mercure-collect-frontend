import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSidebarComponent } from './app-sidebar/app-sidebar.component';
import { AppHeaderComponent } from './app-header/app-header.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';

@Component({
  selector: 'mc-shell',
  standalone: true,
  imports: [RouterOutlet, AppSidebarComponent, AppHeaderComponent, BreadcrumbComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  /** Controls sidebar visibility on mobile/tablet (< 1280px). On desktop the sidebar is
   *  always shown via CSS regardless of this value. */
  protected readonly sidebarOpen = signal(false);
}
