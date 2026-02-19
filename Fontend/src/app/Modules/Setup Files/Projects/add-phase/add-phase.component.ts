import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-add-phase',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-phase.component.html',
  styleUrl: './add-phase.component.scss'
})
export class AddPhaseComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  projectsList: any[] = []; // Will hold project data

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
    private dialogRef: MatDialogRef<AddPhaseComponent> // Reference to the dialog
  ) {}
  selectedFiles: any[] = [];
  ngOnInit(): void {
  console.log(this.data.rowData);
  
    console.log(this.data);
    this.patchFormData();
  }
  addPhase = new FormGroup({
    project_id: new FormControl(this.data.projectid, Validators.required),
    user_id: new FormControl(this.userId),
    phase_name: new FormControl('', Validators.required),
    sequence: new FormControl(''),
    active_status_id: new FormControl(1),
    rera_no: new FormControl(''),
    start_date: new FormControl(''),
    launch_date: new FormControl(''), 
    phase_id: new FormControl(this.data),
    updated_by: new FormControl(this.userId)

  });

  patchFormData(): void {
    this.http
      .post(`${this.baseUrl}/fetch_single_phase`, {
        phase_id: this.data?.rowData?.phase_id,
      })
      .subscribe({
        next: async (data: any) => {
          // Patch form data with API response
          this.addPhase.patchValue({
            phase_name: data?.phase_name || '',
          sequence: data.sequence || '',
          active_status_id: data.active_status_id ?? 1,
          rera_no: data.rera_no || '',
          start_date: data.start_date || '',
          launch_date: data.launch_date || ''
          });
  
          // Handle specification_icon (if exists)
          if (data.specification_icon) {
            this.selectedFiles = [
              {
                file: null, // Since it's from API, no actual file is selected
                preview: `${this.storageUrl}/${data.specification_icon}`, // Display the stored image
              },
            ];
          }
        },
        error: (err: any) => {
          this.snackBar.open('Unable to fetch specification data.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onSubmit(): void {
    const formValues = { ...this.addPhase.value };
    formValues.start_date = formValues.start_date ? new Date(formValues.start_date).toISOString().split('T')[0] : null;
    formValues.launch_date = formValues.launch_date ? new Date(formValues.launch_date).toISOString().split('T')[0] : null;
    if (this.data?.rowData?.phase_id) {
      formValues.phase_id = this.data.rowData.phase_id;
      formValues.updated_by = this.userId; // Assuming userId is stored in sessionStorage
    }
    const { apiUrl, successMessage } = this.data;
  
    this.http.post(`${this.baseUrl}/${apiUrl}`, formValues).subscribe(
      () => {
        this.snackBar.open(successMessage, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      () => {
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }
  deletePhase(phaseID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete this Phase?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .post(`${this.baseUrl}/delete_phase`, {
            phase_id: phaseID,
          })
          .subscribe({
            next: (data: any) => {
              this.dialogRef.close(true);

              this.snackBar.open(
                ` Phase icon deleted successfully`,
                'Close',
                {
                  duration: 3000,
                }
              );
     
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
