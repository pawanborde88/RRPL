import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SupportChatComponent } from '../Common/support-chat/support-chat.component';
import { Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupportChatService {
  private readonly dialog = inject(MatDialog);
  private chatDialogRef?: MatDialogRef<SupportChatComponent>;
  private readonly destroy$ = new Subject<void>();

  /**
   * Opens the support chat dialog if it's not already open
   */
  openSupportChat(): void {
    if (!this.chatDialogRef) {
      this.chatDialogRef = this.dialog.open(SupportChatComponent, {
        width: '650px',
        height: '750px',
        maxWidth: '95vw',
        maxHeight: '95vh',
        panelClass: 'support-chat-dialog',
        disableClose: false,
        autoFocus: true,
        hasBackdrop: true,
        backdropClass: 'support-chat-backdrop',
        closeOnNavigation: true
      });

      // Use takeUntil for proper cleanup
      this.chatDialogRef.afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.chatDialogRef = undefined;
        });
    }
  }

  /**
   * Closes the support chat dialog if it's open
   */
  closeSupportChat(): void {
    if (this.chatDialogRef) {
      this.chatDialogRef.close();
      this.chatDialogRef = undefined;
    }
  }

  /**
   * Toggles the support chat dialog (opens if closed, closes if open)
   */
  toggleSupportChat(): void {
    if (this.chatDialogRef) {
      this.closeSupportChat();
    } else {
      this.openSupportChat();
    }
  }

  /**
   * Checks if the support chat dialog is currently open
   */
  isChatOpen(): boolean {
    return !!this.chatDialogRef;
  }

  /**
   * Cleanup method (called when service is destroyed)
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeSupportChat();
  }
}