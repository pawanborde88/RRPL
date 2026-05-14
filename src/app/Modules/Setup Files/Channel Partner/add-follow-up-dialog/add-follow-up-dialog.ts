import { Component, Inject, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AuthService } from '../../../../Service/auth.service';

export interface AddFollowUpDialogData {
  channel_partner_id?: number;
  booking_id?: number;
  title?: string;
  firm_name?: string;
  addApi?: string;
  fetchApi?: string;
  showProspectCount?: boolean;
}

export interface CpFollowUpItem {
  cp_follow_up_id?: number;
  message: string;
  followup_date: string;
  channel_partner_id?: number;
  booking_id?: number;
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
  private readonly dialog = inject(MatDialog);
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
      prospect_count: ['', this.data?.showProspectCount ? [Validators.required] : []],
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
    const id = this.data?.channel_partner_id || this.data?.booking_id;
    if (!id) {
      this.isLoadingList = false;
      this.cdr.markForCheck();
      return;
    }
    this.isLoadingList = true;
    this.cdr.markForCheck();
    const fetchEndpoint = this.data.fetchApi || 'fetch_cp_follow_up';
    const payload = this.data.channel_partner_id
      ? { channel_partner_id: this.data.channel_partner_id }
      : { booking_id: this.data.booking_id };

    this.http
      .post<FetchCpFollowUpResponse>(`${this.baseUrl}/${fetchEndpoint}`, payload)
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
    const id = this.data?.channel_partner_id || this.data?.booking_id;
    if (this.form.invalid || !id) return;
    const userId = this.authService.userId() || Number(sessionStorage.getItem('session_id')) || 0;
    const payload: any = {
      message: this.form.get('message')?.value?.trim(),
      followup_date: this.formatDateForApi(this.form.get('followup_date')?.value),
      user_id: userId,
      created_by: userId,
    };

    if (this.data.channel_partner_id) payload.channel_partner_id = this.data.channel_partner_id;
    if (this.data.booking_id) payload.booking_id = this.data.booking_id;
    if (this.data.showProspectCount) payload.prospect_count = this.form.get('prospect_count')?.value;

    this.isSubmitting = true;
    this.cdr.markForCheck();
    const addEndpoint = this.data.addApi || 'add_cp_follow_up';
    this.http
      .post<{ success?: boolean; message?: string }>(`${this.baseUrl}/${addEndpoint}`, payload)
      .subscribe({
        next: (res: any) => {
          this.dialog.open(SuccessDialogComponent, {
            data: {
              status: res.success,
              message: res.message || 'Follow-up added successfully'
            }
          });
          this.isSubmitting = false;
          this.cdr.markForCheck();
          this.fetchFollowUps();
          this.form.reset({
            followup_date: new Date(),
            message: '',
            prospect_count: ''
          });
        },
        error: (err: any) => {
          this.dialog.open(SuccessDialogComponent, {
            data: {
              status: false,
              message: err?.error?.message || 'Failed to add follow-up'
            }
          });
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
