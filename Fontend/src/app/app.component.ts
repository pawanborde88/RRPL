import { Component, ViewEncapsulation, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../angular-material.module';
import { QuillModule } from 'ngx-quill';

import { filter } from 'rxjs/operators';
import { PermissonService } from './Service/PermissonAccess/permisson.service';
import { AppStore } from './Core/store/app.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalDraggableDialogService } from './Service/global-draggable-dialog.service';
import { AutoLogoutService } from './Auth/services/auto-logout.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterOutlet, CommonModule, QuillModule],
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly permissionService = inject(PermissonService);
  private readonly appStore = inject(AppStore);
  private readonly draggableDialogService = inject(GlobalDraggableDialogService);
  private readonly autoLogoutService = inject(AutoLogoutService);

  readonly title = 'Dravyam';

  // Routes that should NOT show the template (public routes)
  private readonly publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/register-password',
    '/portal-login-password',
    '/partner-login',
    '/qrform'
  ];

  constructor() {
    // Listen to route changes to determine if template should be shown
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.updateTemplateVisibility(event.url);
      });

    // Set initial state
    this.updateTemplateVisibility(this.router.url);
  }

  private updateTemplateVisibility(url: string): void {
    const showTemplate = !this.publicRoutes.some(route => url.startsWith(route));
    this.appStore.setShowTemplate(showTemplate);
  }

  onActivate() {
    if (isPlatformBrowser(this.platformId)) {
      window.scroll(0, 0);
    }
  }
}
