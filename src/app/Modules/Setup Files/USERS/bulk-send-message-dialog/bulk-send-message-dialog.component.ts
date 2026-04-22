import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { User } from '../services/user.service';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-bulk-send-message-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    AngularMaterialModule,
    ReactiveFormsModule
  ],
  templateUrl: './bulk-send-message-dialog.component.html',
  styleUrl: './bulk-send-message-dialog.component.scss'
})
export class BulkSendMessageDialogComponent {
  public readonly dialogRef = inject(MatDialogRef<BulkSendMessageDialogComponent>);
  public readonly data = inject<{ activeUsers: User[] }>(MAT_DIALOG_DATA);
  baseUrl: string = environment.API_URL;
  storageUrl: string = environment.STORAGE_URL;
  loading: boolean = false;
  allEvents: any[] = [];
  eventIdControl = new FormControl<number | null>(null);

  private userService = inject(UserService);

  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  searchText: string = '';
  constructor(

    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    this.fetchEvents();
  }
  roleId: number = Number(sessionStorage.getItem('role_id'));
  userId: number = Number(sessionStorage.getItem('session_id'));
  accountId: number = Number(sessionStorage.getItem('account_id'));
  fetchEvents(): void {
    const payload: any = {};
    if (this.accountId) {
      payload.account_id = this.accountId;
    }

    this.http.post(`${this.baseUrl}/fetch_event`, payload).subscribe({
      next: (res: any) => {
        let events: any[] = [];
        if (Array.isArray(res?.data)) {
          events = res.data;
        } else if (Array.isArray(res)) {
          events = res;
        } else if (res?.data) {
          events = [res.data];
        } else if (res) {
          events = [res];
        }

        this.allEvents = events.filter(Boolean);


      },
      error: () => {
      },
    });
  }
  onClose() {
    this.dialogRef.close();
  }

  onSendInvitation(): void {
    const eventId = this.eventIdControl.value;
    const userIds = this.data.activeUsers.map(user => user.user_id);

    if (eventId === null || eventId === undefined) {
      this.snackBar.open('Please select an event', 'Close', { duration: 3000 });
      console.log('Event selection missing. Control value:', eventId);
      return;
    }

    if (userIds.length === 0) {
      this.snackBar.open('No users selected', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.userService.sendUsersRegEmail(Number(eventId), userIds).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.snackBar.open(res?.message || 'Invitations sent successfully', 'Success', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.loading = false;
        this.snackBar.open(err?.message || 'Failed to send invitations', 'Error', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
