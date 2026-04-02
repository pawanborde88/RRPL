import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface Recording {
  recording_url: string;
  customer_name: string;
  created_at: string;
  answered_agent_name: string;
  duration?: string; // Optional field
}
interface ApiResponse {
  status: boolean;
  data: Recording[] | string[];
  message?: string;
}

@Component({
  selector: 'app-all-call-recordings',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './all-call-recordings.component.html',
})
export class AllCallRecordingsComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<AllCallRecordingsComponent>);
  private dialogData = inject(MAT_DIALOG_DATA);

  recordings: Recording[] = [];
  isLoading = false;
  isError = false;
  errorMessage = '';
  leadData: any;
  projectLeadId?: number;
  directRecordingUrl?: any;  // For single recording passed directly

  private readonly baseUrl = environment.API_URL;

  ngOnInit(): void {
    if (this.dialogData) {
      console.log('Dialog Data:', this.dialogData); // Debug log

      // Check if a direct recording URL was passed
      if (this.dialogData.recordingUrl) {
        this.directRecordingUrl = this.dialogData.recordingUrl;
        this.recordings = [{
          recording_url: this.cleanRecordingUrl(this.directRecordingUrl),
          customer_name: this.dialogData.customer_name || 'Unknown',
          created_at: this.dialogData.created_at || new Date().toISOString(),
          answered_agent_name: this.dialogData.answered_agent_name || 'Unknown Agent'
        }];
        this.isLoading = false;
      }
      // Otherwise fetch recordings using projectLeadId
      else if (this.dialogData.projectLeadId) {
        this.projectLeadId = this.dialogData.projectLeadId;
        this.leadData = this.dialogData.leadData;
        this.fetchRecordings();
      } else {
        this.showError('No recording URL or project lead ID provided');
      }
    } else {
      this.showError('No data provided to dialog');
    }
  }
  showUrlIndex: number | null = null;


  fetchRecordings(): void {
    if (!this.projectLeadId) return;

    this.isLoading = true;
    this.isError = false;

    this.getCallRecordings(this.projectLeadId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: ApiResponse) => {
          this.isLoading = false;

          if (response.status && response.data?.length > 0) {
            // Map the response data to Recording objects
            this.recordings = (response.data as Recording[]).map((recording: Recording) => {
              return {
                ...recording,
                recording_url: this.cleanRecordingUrl(recording.recording_url)
              };
            });
          } else {
            // If no recordings found but we have a direct URL from dialogData
            if (this.dialogData.recordingUrl) {
              this.recordings = [{
                recording_url: this.cleanRecordingUrl(this.dialogData.recordingUrl),
                customer_name: this.dialogData.customer_name || 'Unknown',
                created_at: this.dialogData.created_at || new Date().toISOString(),
                answered_agent_name: this.dialogData.answered_agent_name || 'Unknown Agent'
              }];
            } else {
              this.showInfo('No recordings found');
              this.recordings = [];
            }
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.isError = true;
          this.errorMessage = error.message || 'Failed to fetch recordings';

          // Fallback: if we have a direct recording URL, use it
          if (this.dialogData.recordingUrl) {
            this.recordings = [{
              recording_url: this.cleanRecordingUrl(this.dialogData.recordingUrl),
              customer_name: this.dialogData.customer_name || 'Unknown',
              created_at: this.dialogData.created_at || new Date().toISOString(),
              answered_agent_name: this.dialogData.answered_agent_name || 'Unknown Agent'
            }];
            this.isError = false;
          } else {
            this.showError(this.errorMessage);
            this.recordings = [];
          }
        }
      });
  }

  getCallRecordings(projectLeadId: number): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/call_recordings`,
      { project_lead_id: projectLeadId },
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      catchError((error) => {
        return throwError(() => ({
          status: false,
          error: error.message,
          message: 'Failed to connect to server'
        }));
      })
    );
  }


  private cleanRecordingUrl(url: string): string {
    if (!url) return '';
    try {
      let cleanUrl = url.replace(/\\\//g, '/');
      if (cleanUrl.includes('%')) {
        cleanUrl = decodeURIComponent(cleanUrl);
      }
      return cleanUrl;
    } catch {
      return url;
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}