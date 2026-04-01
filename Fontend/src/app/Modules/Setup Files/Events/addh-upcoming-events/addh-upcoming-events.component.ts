import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, inject, Inject, signal } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AddChannelPartnerComponent } from '../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { Project } from '../../Enquiry/all-daily-dsrreport/dsr-report.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-addh-upcoming-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent
  ],
  templateUrl: './addh-upcoming-events.component.html',
  styleUrl: './addh-upcoming-events.component.scss',
})
export class AddhUpcomingEventsComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in environment file
  storageUrl = environment.STORAGE_URL;
  accountID = Number(sessionStorage.getItem('account_id'));
  pipe = new DatePipe('en-US');

  roleId = Number(sessionStorage.getItem('role_id'));
  readonly projectsList = signal<Project[]>([]);
  readonly eventTypeList = signal<any[]>([]);
  readonly loading = signal<boolean>(false);
  private readonly destroyRef = inject(DestroyRef);
  readonly userId = signal(Number(sessionStorage.getItem('session_id')));

  selectedFile: File | null = null; // To handle file uploads
  imagePreview: string | null = null;
  isImageRemoved: boolean = false;

  addEvents = new FormGroup({
    account_id: new FormControl(this.accountID), // Default userId if no rowData
    user_id: new FormControl(this.userId), // Default userId if no rowData

    event_title: new FormControl('', Validators.required),
    event_description: new FormControl('', Validators.required),
    event_date: new FormControl('', Validators.required),
    event_start_time: new FormControl('', Validators.required),
    event_end_time: new FormControl('', Validators.required),
    event_venue: new FormControl('', Validators.required),
    event_image: new FormControl<File | null>(null), // Fixed misplaced parenthesis
    is_highlight: new FormControl(false),
    project_id: new FormControl(null),
    event_type_id: new FormControl(null),
    event_id: new FormControl(this.data?.rowData?.event_id || null),
  });

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,

    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddhUpcomingEventsComponent> // Reference to the dialog
  ) { }

  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllProjects();
    this.fetchAllEventTypes();
    if (this.data?.rowData?.event_id) {
      this.fetchSingleEvent(this.data.rowData.event_id);
    }
  }


  private fetchAllProjects(): void {
    this.loading.set(true);
    this.http.post<Project[]>(`${this.baseUrl}/user_project_dropdown`, { user_id: this.userId() })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projects) => this.projectsList.set(projects || []),
        error: () => this.showSnackBar('Unable to fetch projects.'),
      });
  }

  fetchAllEventTypes(): void {
    this.http.get<any[]>(`${this.baseUrl}/fetch_event_type`).subscribe({
      next: (res) => {
        this.eventTypeList.set(res || []);
      },
      error: (err) => {
        console.error('Error fetching event types:', err);
      }
    });
  }
  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
  fetchSingleEvent(eventId: any): void {
    this.http
      .post(`${this.baseUrl}/fetch_single_event`, {
        event_id: eventId,
      })
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.addEvents.patchValue({
              account_id: res.account_id || this.accountID,
              user_id: res.user_id || this.userId,
              event_title: res.event_title || '',
              event_description: res.event_description || '',
              event_date: res.event_date || '',
              event_start_time: res.event_start_time || '',
              event_end_time: res.event_end_time || '',
              event_venue: res.event_venue || '',
              is_highlight:
                res.is_highlight === 1 || res.is_highlight === '1' ? true : false,
              project_id: res.project_id || null,
              event_type_id: res.event_type_id || null,
              event_id: res.event_id || null,
            });

            // If an event image is available, update the preview
            if (res.event_image) {
              this.imagePreview = `${this.storageUrl}/${res.event_image}`;
            }
          }
        },
        error: (err: any) => {
          console.log(err);
          this.snackBar.open(
            'Error occurred while fetching data, please try later',
            'Close',
            { duration: 3000 }
          );
        },
        complete: () => {
          this.snackBar.dismiss();
        },
      });
  }
  onSubmit(): void {
    if (this.addEvents.invalid) {
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const apiUrl = this.data.apiUrl;
    const formData = new FormData();

    Object.keys(this.addEvents.controls).forEach((key) => {
      let controlValue = this.addEvents.get(key)?.value;

      // Format event_date before appending
      if (key === 'event_date' && controlValue) {
        controlValue = this.pipe.transform(controlValue, 'yyyy-MM-dd')!;
      }

      if (key === 'is_highlight') {
        controlValue = controlValue ? '1' : '0';
      }

      if (controlValue !== null && controlValue !== undefined) {
        formData.append(
          key,
          controlValue instanceof File ? controlValue : String(controlValue)
        );
      }
    });

    formData.append('is_image_removed', this.isImageRemoved ? '1' : '0');

    // If event_id exists, include it in formData
    if (this.data.rowData?.event_id) {
      formData.append('event_id', String(this.data.rowData.event_id));
      formData.append('updated_by', String(this.userId));
    }

    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      (response) => {
        console.log(response);
        this.snackBar.open(this.data.successMessage, 'Close', {
          duration: 3000,
        });
        this.dialogRef.close(true); // Close the dialog and notify the parent component
      },
      (error) => {
        console.error('Error:', error);
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }
  onDeleteImage(): void {
    this.imagePreview = null;
    this.selectedFile = null;
    this.isImageRemoved = true;
    this.addEvents.patchValue({ event_image: null }); // Reset form control
  }

  onChangeFile(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0]; // Handle only one file

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string; // Show preview
      };
      reader.readAsDataURL(file);

      this.selectedFile = file;
      this.isImageRemoved = false;
      this.addEvents.patchValue({ event_image: file });
    }
  }


}
