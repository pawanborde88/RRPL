import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddwingsComponent } from '../../addwings/addwings.component';

@Component({
  selector: 'app-add-floor-unit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-floor-unit.component.html',
  styleUrl: './add-floor-unit.component.scss'
})
export class AddFloorUnitComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  projectsList: any[] = []; // Will hold project data
  allProjectPhases: any[] = []; // Will hold project data

  selectedFile: File | null = null; // To handle file uploads
  allFeetList: any[] = [];
  allWingslist: any[] = []; // Will hold wings data
 

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
      this.fetchAllWings();
       // Fetch wings data based on project ID
      console.log(this.data);
      this.patchFormData();
    }
  }
  addFloorForm = new FormGroup({
    project_id: new FormControl(this.data.projectid, Validators.required),
    user_id: new FormControl(this.userId),
    wing_id: new FormControl(),
    floor_name: new FormControl(this.data?.rowData?.floor_name, Validators.required),
    active_status_id: new FormControl(1, Validators.required),
    floor_id: new FormControl(this.data?.rowData?.floor_id,),
    updated_by: new FormControl(this.userId),
  });

  patchFormData(): void {
    this.http
      .post(`${this.baseUrl}/fetch_single_floor`, {
        floor_id: this.data?.rowData?.floor_id,
      })
      .subscribe({
        next: (data: any) => {
          if (data) {
            this.addFloorForm.patchValue({
              floor_name: data.floor_name || '',
              active_status_id: data.active_status_id ?? 1,
              wing_id: data.wing_id || this.data?.rowData?.wing_id,
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

  fetchAllWings(): void {
    this.http
      .post(`${this.baseUrl}/wing_dropdown`, { project_id: this.data.projectid })
      .subscribe({
        next: (res: any) => {
          this.allWingslist = res;
        },
        error: () => {
          this.snackBar.open('Unable to fetch project details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  onSubmit(): void {
    const { apiUrl, successMessage } = this.data;

    // Collect form data and add wing_id
    const payload = {
      ...this.addFloorForm.value,
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

  deleteFloor(floorID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete this Floor?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .post(`${this.baseUrl}/delete_floor`, {
            floor_id: floorID,
          })
          .subscribe({
            next: (data: any) => {
              this.dialogRef.close(true);

              this.snackBar.open(` Floor  deleted successfully`, 'Close', {
                duration: 3000,
              });
             
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
