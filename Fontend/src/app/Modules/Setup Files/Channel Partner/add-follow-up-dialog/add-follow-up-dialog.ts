import { Component, Inject, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AuthService } from '../../../../Service/auth.service';

export interface AddFollowUpDialogData {
  channel_partner_id: number;
  firm_name?: string;
}

export interface CpFollowUpItem {
  cp_follow_up_id?: number;
  message: string;
  followup_date: string;
  channel_partner_id: number;
  user_id?: number;
  created_by?: number;
  created_at?: string;
  updated_by?: number | null;
  updated_at?: string | null;
  created_by_name?: string;
  firm_name?: string;
}

interface FetchCpFollowUpResponse {
  success: boolean;
  data: CpFollowUpItem[];
}

@Component({
  selector: 'app-add-follow-up-dialog',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule, ReactiveFormsModule],
  templateUrl: './add-follow-up-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFollowUpDialog implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<AddFollowUpDialog>);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly baseUrl = environment.API_URL;

  followUpList: CpFollowUpItem[] = [];
  isLoadingList = false;
  isSubmitting = false;
  form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: AddFollowUpDialogData) {
    this.form = this.fb.group({
      message: ['', [Validators.required]],
      followup_date: [new Date(), [Validators.required]],
    });
  }

  private formatDateForApi(date: Date | null): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().slice(0, 10);
  }

  ngOnInit(): void {
    this.fetchFollowUps();
  }

  fetchFollowUps(): void {
    if (!this.data?.channel_partner_id) {
      this.isLoadingList = false;
      this.cdr.markForCheck();
      return;
    }
    this.isLoadingList = true;
    this.cdr.markForCheck();
    this.http
      .post<FetchCpFollowUpResponse>(`${this.baseUrl}/fetch_cp_follow_up`, {
        channel_partner_id: this.data.channel_partner_id,
      })
      .subscribe({
        next: (res) => {
          const raw = res && typeof res === 'object' && 'data' in res ? (res as FetchCpFollowUpResponse).data : res;
          this.followUpList = Array.isArray(raw) ? raw : [];
          this.isLoadingList = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackBar.open('Failed to load follow-ups', 'Close', { duration: 3000 });
          this.followUpList = [];
          this.isLoadingList = false;
          this.cdr.markForCheck();
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.data?.channel_partner_id) return;
    const userId = this.authService.userId() || Number(sessionStorage.getItem('session_id')) || 0;
    const payload = {
      message: this.form.get('message')?.value?.trim(),
      followup_date: this.formatDateForApi(this.form.get('followup_date')?.value),
      channel_partner_id: this.data.channel_partner_id,
      user_id: userId,
      created_by: userId,
    };
    this.isSubmitting = true;
    this.cdr.markForCheck();
    this.http
      .post<{ success?: boolean; message?: string }>(`${this.baseUrl}/add_cp_follow_up`, payload)
      .subscribe({
        next: () => {
          this.snackBar.open('Follow-up added successfully', 'Close', { duration: 3000 });
          this.isSubmitting = false;
          this.cdr.markForCheck();
          this.fetchFollowUps();
        },
        error: () => {
          this.snackBar.open('Failed to add follow-up', 'Close', { duration: 3000 });
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
