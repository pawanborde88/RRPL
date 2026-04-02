import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
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
import { AddPhaseComponent } from '../add-phase/add-phase.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-addwings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './addwings.component.html',
  styleUrl: './addwings.component.scss',
})
export class AddwingsComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  projectsList: any[] = []; // Will hold project data
  allProjectPhases: any[] = []; // Will hold project data

  selectedFile: File | null = null; // To handle file uploads
  allFeetList: any[] = [];

  imageSize: string | null = null;
  imagePreview: string | null = null;
  storageUrl = environment.STORAGE_URL;

  pipe = new DatePipe('en-US');
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,

    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddwingsComponent> // Reference to the dialog
  ) {}
  selectedFiles: any[] = [];
  ngOnInit(): void {
    console.log(this.data.phaseID);

    if (this.data.projectid) {
      this.fetchProjectPhases();
      console.log(this.data);
      this.patchFormData();
    }
  }
  addWingsForm = new FormGroup({
    project_id: new FormControl(this.data.projectid, Validators.required),
    user_id: new FormControl(this.userId),
    wing_name: new FormControl(
      this.data?.rowData?.wing_name,
      Validators.required
    ),
    active_status_id: new FormControl(1, Validators.required),
    phase_id: new FormControl(this.data.phaseID),
    updated_by: new FormControl(this.userId),
  });

  patchFormData(): void {
    this.http
      .post(`${this.baseUrl}/fetch_single_wing`, {
        phase_id: this.data?.rowData?.phase_id,
      })
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.addWingsForm.patchValue({
              wing_name: data.wing_name || '',
              active_status_id: data.active_status_id ?? 1,
              phase_id: data.phase_id || this.data?.rowData?.phase_id,
            });
          }
        },
        error: () => {
          this.snackBar.open('Unable to fetch wing data.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  fetchProjectPhases(): void {
    this.http
      .post(`${this.baseUrl}/fetch_phases`, { project_id: this.data.projectid })
      .subscribe({
        next: (res: any) => {
          this.allProjectPhases = res || [];
        },
        error: () => {
          this.snackBar.open('Unable to fetch project phases.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  onSubmit(): void {
    const { apiUrl, successMessage } = this.data;

    // Collect form data and add wing_id
    const payload = {
      ...this.addWingsForm.value,
      wing_id: this.data?.rowData?.wing_id, // Add wing_id if available
      updated_by: this.userId, // Add wing_id if available
    };

    this.http.post(`${this.baseUrl}/${apiUrl}`, payload).subscribe({
      next: () => {
        this.snackBar.open(successMessage, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  deletewings(wingsID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete this Phase?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .post(`${this.baseUrl}/delete_wing`, {
            wing_id: wingsID,
          })
          .subscribe({
            next: (data: any) => {
              this.dialogRef.close(true);

              this.snackBar.open(` Wing  deleted successfully`, 'Close', {
                duration: 3000,
              });
              this.fetchProjectPhases();
            },
            error: (err: any) => {
              console.error(err);
              this.snackBar.open('Unable to delete the image.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
