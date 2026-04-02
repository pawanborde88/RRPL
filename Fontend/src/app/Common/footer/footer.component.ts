import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  PLATFORM_ID,
  inject,
  signal,
  computed,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AngularMaterialModule } from '../../../angular-material.module';
import { SupportChatService } from '../../Service/support-chat.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  standalone: true,
  imports: [AngularMaterialModule],
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnInit, OnDestroy {
  // Dependency injection using inject() function
  private readonly supportChatService = inject(SupportChatService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroy$ = new Subject<void>();

  // Constants
  private readonly APP_VERSION = '10.0.3';
  private readonly APP_ENVIRONMENT = 'Development';

  // Reactive state using signals
  private readonly isChatOpenSignal = signal<boolean>(false);

  // Computed values (memoized and reactive)
  readonly currentYear = computed(() => new Date().getFullYear());

  readonly versionInfo = computed(() => 
    `Version ${this.APP_VERSION} | ${this.APP_ENVIRONMENT}`
  );

  readonly isChatOpen = this.isChatOpenSignal.asReadonly();

  ngOnInit(): void {
    // Initialize chat state on component load
    if (isPlatformBrowser(this.platformId)) {
      const isOpen = this.supportChatService.isChatOpen();
      this.isChatOpenSignal.set(isOpen);
    }
  }

  ngOnDestroy(): void {
    // Proper cleanup
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle support chat with optimized state management
   */
  toggleSupportChat(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Toggle chat state
    this.supportChatService.toggleSupportChat();
    
    // Update local state based on service state
    const isOpen = this.supportChatService.isChatOpen();
    this.isChatOpenSignal.set(isOpen);
    this.cdr.markForCheck();
  }
}
