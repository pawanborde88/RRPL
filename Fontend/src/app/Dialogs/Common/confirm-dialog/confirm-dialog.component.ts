import { Component, Inject, OnInit } from '@angular/core';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Interface for the confirm dialog data
 */
export interface ConfirmDialogData {
  message: string;
  itemName?: string;
  permanent?: boolean;
  title?: string;
}

/**
 * Interface for the confirm dialog result
 */
export interface ConfirmDialogResult {
  confirmed: boolean;
  reason?: string;
}

/**
 * Confirmation dialog component with reason input
 * Used for deletion actions that require user confirmation and reason
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  standalone: true,
  imports: [AngularMaterialModule, CommonModule, FormsModule],
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {
  /** User-provided reason for the deletion */
  reason: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
    private dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {
    // Set default data if not provided
    this.data = {
      message: this.data?.message || 'Are you sure you want to proceed?',
      itemName: this.data?.itemName,
      permanent: this.data?.permanent ?? false,
      title: this.data?.title || 'Confirm Deletion'
    };
  }

  ngOnInit(): void {
    // Construct message if itemName is provided
    if (this.data.itemName) {
      this.data.message = `Are you sure you want to delete "${this.data.itemName}"?`;
      
      if (this.data.permanent) {
        this.data.message += ' This action cannot be undone.';
      }
    }

    // Configure dialog to prevent closing on backdrop click
    this.dialogRef.disableClose = true;
  }

  /**
   * Closes the dialog with confirmation result
   * @param confirm Whether the user confirmed the action
   */
  closeDialog(confirm: boolean): void {
    if (confirm) {
      const trimmedReason = this.reason.trim();
      
      // Validate reason before confirming
      if (!trimmedReason) {
        return;
      }

      this.dialogRef.close({
        confirmed: true,
        reason: trimmedReason
      } as ConfirmDialogResult);
    } else {
      this.dialogRef.close({
        confirmed: false
      } as ConfirmDialogResult);
    }
  }

  /**
   * Checks if the reason is valid
   * @returns true if reason is valid and not empty
   */
  isReasonValid(): boolean {
    return this.reason.trim().length >= 3;
  }

  /**
   * Handles delete button click
   * Validates and closes dialog with confirmation
   */
  onDeleteClick(): void {
    if (this.isReasonValid()) {
      this.closeDialog(true);
    }
  }
}