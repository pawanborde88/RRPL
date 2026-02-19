import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { HttpClient } from '@angular/common/http';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { SuccessDialogComponent } from '../../../Common/success-dialog/success-dialog.component';
import { AddFaceBookComponent } from '../../Facebook/Facebook Setup/add-face-book/add-face-book.component';
import { CommonService } from '../../../Service/common/common.service';
interface DropdownItem {
  user_id: number;
  first_name: string;
  last_name: string;
  [key: string]: any;
}

interface Project {
  project_id: number;
  property_name: string;
  [key: string]: any;
}

interface CPReportForm {
  sourcing_manger_id: number | null;
  cluster_id: number | null;
  project_id: number | null;
  unique_cp_target: number | null;
  retention_target: number | null;
  director_id: number | null;
  cp_visit_target: number | null;
  cp_booking_target: number | null;
  target_from: string | null;
  token_target: string | null;

  target_to: string | null;
  created_by: number;
}
@Component({
  selector: 'app-add-cpreport',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-cpreport.component.html',
  styleUrl: './add-cpreport.component.scss',
})
export class AddCPreportComponent {
  private readonly baseUrl = environment.API_URL;
  private readonly commonService = inject(CommonService);
  private readonly roleId = Number(sessionStorage.getItem('role_id'));
  private readonly userId = Number(sessionStorage.getItem('session_id'));
  datePipe = new DatePipe('en-US');

  selectedFile: File | null = null;
  allDirectorDropdown: DropdownItem[] = [];
  allSourcingManagerDropdown: DropdownItem[] = [];
  allClusterHeadDropdown: DropdownItem[] = [];
  projectsList: Project[] = [];
  allConfiguration: any[] = [];
  isEditMode = false;
  CPTarketID: number | null = null;

  cpReportForm = new FormGroup({
    sourcing_manger_id: new FormControl<number | null>(null, [Validators.required]),
    cluster_id: new FormControl<number | null>(null, [Validators.required]),
    project_id: new FormControl<number | null>(null, [Validators.required]),
    unique_cp_target: new FormControl<number | null>(null, [Validators.required]),
    retention_target: new FormControl<number | null>(null, [Validators.required]),
    director_id: new FormControl<number | null>(null),
    cp_visit_target: new FormControl<number | null>(null),
    cp_booking_target: new FormControl<number | null>(null),
    target_from: new FormControl<string | null>(null, [Validators.required]),
    token_target: new FormControl<string | null>(null),

    target_to: new FormControl<string | null>(null, [Validators.required]),
    created_by: new FormControl<number>(this.userId)
  });

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddCPreportComponent>
  ) { }

  ngOnInit(): void {
    console.log('Data received in dialog:', this.data.row);

    this.initializeForm();
    this.fetchInitialData();
  }

  private initializeForm(): void {
    if (this.data) {
      this.isEditMode = true;
      this.CPTarketID = this.data.row?.cluster_id;
      this.cpReportForm.patchValue(this.data.row);
    }
  }

  private fetchInitialData(): void {
    this.fetchAllProjects();
    this.fetchAllDirectors();
    this.fetchAllSourcingManagers();
    this.fetchAllClusterHeads();
  }

  private fetchAllProjects(): void {
    this.commonService.fetchUserProjectDropdown()
      .subscribe({
        next: (projects: Project[]) => this.projectsList = projects,
        error: (err: unknown) => {
          console.error('Error fetching projects:', err);
          this.showErrorMessage('Failed to fetch projects data.');
          this.projectsList = [];
        }
      });
  }

  private fetchAllDirectors(): void {
    this.commonService.fetchDirectorDropdown([8])
      .subscribe({
        next: (directors: DropdownItem[]) => this.allDirectorDropdown = directors || [],
        error: (err: unknown) => {
          console.error('Error fetching directors:', err);
          this.showErrorMessage('Unable to fetch directors.');
        }
      });
  }

  private fetchAllSourcingManagers(): void {
    this.commonService.fetchSourcingManagerDropdown([21])
      .subscribe({
        next: (managers: DropdownItem[]) => this.allSourcingManagerDropdown = managers || [],
        error: (err: unknown) => {
          console.error('Error fetching sourcing managers:', err);
          this.showErrorMessage('Unable to fetch sourcing managers.');
        }
      });
  }

  private fetchAllClusterHeads(): void {
    this.commonService.fetchClusterHeadDropdown([20])
      .subscribe({
        next: (heads: DropdownItem[]) => this.allClusterHeadDropdown = heads || [],
        error: (err: unknown) => {
          console.error('Error fetching cluster heads:', err);
          this.showErrorMessage('Unable to fetch cluster heads.');
        }
      });
  }

  onSubmit(): void {
    if (this.cpReportForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    const formData = this.prepareFormData();
    const apiEndpoint = this.CPTarketID ? 'edit_facebook_setup' : 'add_cp_target';

    this.http.post(`${this.baseUrl}/${apiEndpoint}`, formData)
      .subscribe({
        next: (res: any) => this.handleSuccess(res),
        error: (error) => this.handleError(error)
      });
  }

  private prepareFormData(): CPReportForm {
    const formValue = this.cpReportForm.value;

    return {
      ...formValue,
      created_by: this.userId,
      target_from: formValue.target_from ? this.datePipe.transform(formValue.target_from, 'yyyy-MM-dd') : null,
      target_to: formValue.target_to ? this.datePipe.transform(formValue.target_to, 'yyyy-MM-dd') : null
    } as CPReportForm;
  }
  private markAllAsTouched(): void {
    Object.values(this.cpReportForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  private handleSuccess(response: any): void {
    const message = response.success
      ? response.message
      : response.message || 'Operation failed';

    this.dialog.open(SuccessDialogComponent, { data: { message } });

    if (response.success) {
      this.cpReportForm.reset();
      this.dialogRef.close(true);
    }
  }

  private handleError(error: any): void {
    const message = error.error?.message || 'Something went wrong';
    this.dialog.open(SuccessDialogComponent, { data: { message } });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
