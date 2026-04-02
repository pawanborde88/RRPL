import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { AddPresalesTargetDialogComponent } from '../../../../Target & Achievement/Pre Sales/add-presales-target-dialog/add-presales-target-dialog.component';

@Component({
  selector: 'app-add-new-mom-meeting-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-new-mom-meeting-dialog.component.html',
  styleUrl: './add-new-mom-meeting-dialog.component.scss'
})
export class AddNewMomMeetingDialogComponent implements OnInit {
  private readonly baseUrl = environment.API_URL;
  private readonly roleId = Number(sessionStorage.getItem('role_id'));
  private readonly userId = Number(sessionStorage.getItem('session_id'));
  
  projectsList: any[] = [];
  allRoleList: any[] = [];
  allUserList: any[] = [];
  isEditMode: boolean = false;
  meetingId: number | null = null;
  isLoading: boolean = false;

  private pipe = new DatePipe('en-US');

  meetingForm = new FormGroup({
    title: new FormControl<string>('', [Validators.required, Validators.minLength(3)]),
    date: new FormControl<Date | string | null>(null, Validators.required),
    project_id: new FormControl<number | null>(null, Validators.required),
    venue: new FormControl<string>('', Validators.minLength(2)),
    role_id: new FormControl<number[]>([], Validators.required),
    attendees: new FormControl<number[]>([], [Validators.required, Validators.minLength(1)]),
    agenda: new FormControl<string>('', Validators.minLength(10)),
    created_by: new FormControl<number>(this.userId),
    email_content: new FormControl<string>('', [Validators.required, Validators.minLength(20)]),
    email_subject: new FormControl<string>('', [Validators.required, Validators.minLength(5)]),
    meeting_type: new FormControl<number | null>(null),
    meeting_link: new FormControl<string>('')
  });

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddNewMomMeetingDialogComponent>
  ) {
    // Check if we're in edit mode - data will be the meeting object for edit, null/undefined for add
    this.isEditMode = !!data;
    if (this.isEditMode && data) {
      this.meetingId = data.meeting_id || data.id;
    }
  }

  ngOnInit(): void {
    console.log('Dialog Data:', this.data);
    console.log('Is Edit Mode:', this.isEditMode);
    
    this.fetchAllProjects();
    
    // Subscribe to role changes to fetch users
    this.meetingForm.get('role_id')?.valueChanges.subscribe(roleIds => {
      if (roleIds && roleIds.length > 0) {
        this.fetchAllUsersList(roleIds);
      } else {
        this.allUserList = [];
      }
    });

    // Subscribe to meeting type changes for conditional validation
    this.meetingForm.get('meeting_type')?.valueChanges.subscribe(meetingType => {
      const meetingLinkControl = this.meetingForm.get('meeting_link');
      if (meetingType === 2) { // Virtual meeting
        meetingLinkControl?.setValidators([Validators.required, Validators.pattern('https?://.+')]);
      } else {
        meetingLinkControl?.clearValidators();
      }
      meetingLinkControl?.updateValueAndValidity();
    });

    // If in edit mode, initialize form with existing data
    if (this.isEditMode) {
      this.initializeFormForEdit();
    }
  }

  private initializeFormForEdit(): void {
    if (this.meetingId) {
      this.http.post(`${this.baseUrl}/fetch_internal_meeting`, {meeting_id: this.meetingId}).subscribe({
        next: (res: any) => {
          if (res && res.success && res.data && res.data.length > 0) {
            const meetingData = res.data[0];
            console.log('Meeting data for edit:', meetingData);
            
            // First fetch roles and users, then patch the form
            this.fetchAllRoles().then(() => {
              this.meetingForm.patchValue({
                title: meetingData.title || '',
                date: meetingData.date ? new Date(meetingData.date) : null,
                project_id: meetingData.project_id || null,
                venue: meetingData.venue || '',
                role_id: meetingData.role_id || null,
                attendees: meetingData.attendees || [],
                agenda: meetingData.agenda || '',
                email_content: meetingData.email_content || '',
                email_subject: meetingData.email_subject || '',
                meeting_type: meetingData.meeting_type || null,
                meeting_link: meetingData.meeting_link || ''
              });
              
              // If we have attendees, fetch users for the role
              if (meetingData.role_id) {
                // Convert single role_id to array if it's not already an array
                const roleIds = Array.isArray(meetingData.role_id) ? meetingData.role_id : [meetingData.role_id];
                this.fetchAllUsersList(roleIds);
              }
            });
          } else {
            this.snackBar.open('No meeting data found', 'Close', { duration: 3000 });
            this.dialogRef.close();
          }
        },
        error: (error) => {
          console.error('Error fetching meeting data:', error);
          this.snackBar.open('Failed to fetch meeting data', 'Close', { duration: 3000 });
          this.dialogRef.close();
        }
      });
    } else {
      this.snackBar.open('Invalid meeting ID', 'Close', { duration: 3000 });
      this.dialogRef.close();
    }
  }

  onSubmit(): void {
    if (this.meetingForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Additional validation for edit mode
    if (this.isEditMode && !this.meetingId) {
      this.snackBar.open('Invalid meeting data for editing', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isLoading = true;
    const formData = this.prepareFormData();
    const apiEndpoint = this.isEditMode ? 'edit_internal_meeting' : 'add_internal_meeting';


    this.http.post(`${this.baseUrl}/${apiEndpoint}`, formData).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if(res.success){
          const successMessage = this.isEditMode ? 'Meeting updated successfully' : 'Meeting created successfully';
          this.snackBar.open(res.message || successMessage, 'Close', {
            duration: 3000,
          });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(res.message || 'Failed to save meeting', 'Close', {
            duration: 3000,
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.handleError(error);
      }
    });
  }

  private prepareFormData(): any {
    const formValue = this.meetingForm.value;
    
    const payload: any = {
      title: formValue.title,
      date: this.pipe.transform(formValue.date, 'yyyy-MM-dd'),
      project_id: formValue.project_id,
      venue: formValue.venue,
      role_id: formValue.role_id,
      attendees: formValue.attendees,
      agenda: formValue.agenda,
      created_by: formValue.created_by,
      email_content: formValue.email_content,
      email_subject: formValue.email_subject,
      meeting_type: formValue.meeting_type,
      meeting_link: formValue.meeting_link,
      updated_by: this.userId
    };

    // If editing, include the meeting ID
    if (this.isEditMode && this.meetingId) {
      payload.meeting_id = this.meetingId;
      payload.updated_by = this.userId;

    }

    return payload;
  }

  private handleError(error: any): void {
    console.error('Error:', error);
    this.snackBar.open(
      error.error?.message || 'Something went wrong. Please try again.', 
      'Close', 
      { duration: 3000 }
    );
  }

  private fetchAllProjects(): void {
    const payload = {
      user_id:  this.userId,
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        this.projectsList = res || [];
        if (!this.isEditMode) {
          // Only fetch roles if not in edit mode (edit mode will fetch roles after getting meeting data)
          this.fetchAllRoles();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch projects.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  private fetchAllRoles(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.baseUrl}/roles_dropdown`).subscribe({
        next: (res: any) => {
          this.allRoleList = res || [];
          resolve();
        },
        error: (err: any) => {
          console.error(err);
          this.snackBar.open('Unable to fetch roles.', 'Close', {
            duration: 3000,
          });
          reject(err);
        },
      });
    });
  }

  private fetchAllUsersList(roleIds: number[]): void {
    // If no role IDs provided, clear the user list
    if (!roleIds || roleIds.length === 0) {
      this.allUserList = [];
      return;
    }

    // Send all role IDs in a single API call
    this.http.post(`${this.baseUrl}/fetch_users`, { role_id: roleIds }).subscribe({
      next: (res: any) => {
        this.allUserList = res || [];
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch users.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
