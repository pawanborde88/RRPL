import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';

@Component({
  selector: 'app-email-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './email-confirmation-dialog.component.html',
  styleUrl: './email-confirmation-dialog.component.scss'
})
export class EmailConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EmailConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {customerName: string, customerEmail: string}
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  confirmSend(): void {
    this.dialogRef.close(true);
  }
}
