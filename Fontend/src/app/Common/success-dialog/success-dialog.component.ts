import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../angular-material.module';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface StatusDialogData {
  status: boolean;
  message: string;
  showButton?: boolean;
  buttonText?: string;
}
@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './success-dialog.component.html',
  styleUrl: './success-dialog.component.scss',
})
export class SuccessDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: StatusDialogData) {
    this.data = {
      ...{
        status: true,
        message: 'Operation completed successfully',
        showButton: false,
        buttonText: 'OK'
      },
      ...data
    };
  }

  get icon() {
    return this.data.status ? 'check_circle' : 'error_outline';
  }

  get title() {
    if (this.data.status) {
      return 'Done';
    } else {
      return '';
    }
  }
}
