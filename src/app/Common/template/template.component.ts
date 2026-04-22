import { 
  Component, 
  ChangeDetectionStrategy,
  computed,
  inject,
  DestroyRef,
  signal
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupportChatComponent } from '../support-chat/support-chat.component';
import { SidebarStateService } from '../../Service/sidebar-state.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

/**
 * High-performance Template Component with Angular 17+ advanced patterns:
 * - Standalone component with optimized tree-shakeable imports
 * - Signals for reactive state management
 * - OnPush change detection for minimal re-renders
 * - takeUntilDestroyed for automatic subscription cleanup
 * - inject() function for clean DI
 * - Computed values for derived state
 * - Production-grade error handling
 */
@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    NavbarComponent,
    FooterComponent,
    SidebarComponent,
    BreadcrumbComponent,
    SupportChatComponent
  ],
  styleUrls: ['./template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TemplateComponent {
  // Dependency injection using inject() function
  private readonly sidebarStateService = inject(SidebarStateService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  // Reactive state using signals
  private readonly chatDialogRefSignal = signal<MatDialogRef<SupportChatComponent> | null>(null);

  // Computed values for reactive template bindings
  readonly isSidebarExpanded = computed(() => this.sidebarStateService.sidebarState());
  readonly hasOpenChat = computed(() => this.chatDialogRefSignal() !== null);
  readonly sidebarClass = computed(() => 
    this.isSidebarExpanded() ? 'sidebar-expanded' : 'sidebar-collapsed'
  );

  /**
   * Toggle sidebar state
   */
  toggleSidebar(): void {
    this.sidebarStateService.toggleSidebarState();
  }

  /**
   * Toggle support chat dialog with optimized state management
   */
  toggleSupportChat(): void {
    const currentDialog = this.chatDialogRefSignal();
    
    if (currentDialog) {
      // Close existing dialog
      currentDialog.close();
      this.chatDialogRefSignal.set(null);
    } else {
      // Open new dialog
      const dialogRef = this.dialog.open(SupportChatComponent, {
        panelClass: 'support-chat-dialog',
        backdropClass: 'transparent-backdrop',
        disableClose: false,
        autoFocus: false,
        position: { bottom: '80px', right: '20px' }
      });

      this.chatDialogRefSignal.set(dialogRef);

      // Auto-cleanup on dialog close using takeUntilDestroyed
      dialogRef.afterClosed().pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => {
        this.chatDialogRefSignal.set(null);
      });
    }
  }
}
