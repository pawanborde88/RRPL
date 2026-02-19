import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { ImportLeadsuccessHistoryComponent } from '../../Projects/Leads/import-leadsuccess-history/import-leadsuccess-history.component';

interface ProjectDto {
  project_id: number;
  property_name: string;
  [key: string]: unknown;
}

interface SalesExecutiveDto {
  user_id: number;
  user_name: string;
  [key: string]: unknown;
}

interface WingDto {
  wing_id: number;
  wing_name: string;
  [key: string]: unknown;
}

interface ImportDialogData {
  for?:
  | 'projectLead'
  | 'enquiryImport'
  | 'bookingImport'
  | 'receiptsImport'
  | 'Floor-unit'
  | 'Parking-Unit'

  | string;
  API_URL?: string;
}

interface ExcelUploadFormModel {
  file: FormControl<File | null>;
  user_id: FormControl<number | null>;
  project_id: FormControl<number | number[] | null>;
  created_by: FormControl<number | null>;
  sales_executive_id: FormControl<number | number[] | null>;
  wing_id: FormControl<number | null>;
}

@Component({
  selector: 'app-import-floor-units',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    AutocompleteReusableComponent,
  ],
  templateUrl: './import-floor-units.component.html',
  styleUrl: './import-floor-units.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFloorUnitsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // MAT_DIALOG_DATA and MatDialogRef must use constructor injection
  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: ImportDialogData,
    private readonly dialogRef: MatDialogRef<ImportFloorUnitsComponent>
  ) { }

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;

  private readonly roleId = Number(sessionStorage.getItem('role_id') ?? 0);
  private readonly userId = Number(sessionStorage.getItem('session_id') ?? 0);

  projectsList: ProjectDto[] = [];
  allSalesExecutive: SalesExecutiveDto[] = [];
  allWingslist: WingDto[] = [];

  excelUploadForm: FormGroup<ExcelUploadFormModel> = new FormGroup<ExcelUploadFormModel>({
    file: new FormControl<File | null>(null),
    user_id: new FormControl<number | null>(this.userId || null),
    project_id: new FormControl<number | number[] | null>(null),
    created_by: new FormControl<number | null>(this.userId || null),
    sales_executive_id: new FormControl<number | number[] | null>(null),
    wing_id: new FormControl<number | null>(null),
  });

  selectedFile: File | null = null;
  loading = false;

  ngOnInit(): void {
    this.fetchAllProjects();

    this.excelUploadForm
      .get('project_id')
      ?.valueChanges.subscribe((projectID) => {
        const normalizedProjectId = this.normalizeSingleSelectValue(projectID);

        if (normalizedProjectId) {
          this.fetchAllSalesExecutive(normalizedProjectId);

          if (this.data?.for === 'receiptsImport') {
            this.fetchWings(normalizedProjectId);
          }
        } else {
          this.allSalesExecutive = [];
          this.excelUploadForm.get('sales_executive_id')?.reset();

          this.allWingslist = [];
          this.excelUploadForm.get('wing_id')?.reset();
        }
      });
  }

  private normalizeSingleSelectValue(
    value: number | number[] | null | undefined
  ): number | null {
    if (Array.isArray(value)) {
      const firstValue = value[0];
      return firstValue !== undefined && firstValue !== null
        ? Number(firstValue)
        : null;
    }

    if (value === null || value === undefined) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.selectedFile = file;
    this.excelUploadForm.get('file')?.setValue(file);
  }

  fetchAllProjects(): void {
    this.loading = true;

    const payload = {
      user_id: this.userId || null,
    };

    this.http
      .post<ProjectDto[]>(`${this.baseUrl}/user_project_dropdown`, payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.projectsList = res ?? [];
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('Unable to fetch projects.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  fetchWings(projectID: number): void {
    this.http
      .post<WingDto[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectID })
      .subscribe({
        next: (res) => {
          this.allWingslist = res ?? [];
        },
        error: () => {
          this.snackBar.open('Unable to fetch project wings.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  fetchAllSalesExecutive(projectID: number): void {
    this.http
      .post<SalesExecutiveDto[]>(
        `${this.baseUrl}/project_sales_executive_dropdown`,
        { project_id: projectID }
      )
      .subscribe({
        next: (res) => {
          this.allSalesExecutive = res ?? [];
        },
        error: (err) => {
          console.error(err);

          this.snackBar.open('Unable to fetch channel partners.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  getDialogTitle(): string {
    switch (this.data?.for) {
      case 'projectLead':
        return 'Import Lead Sheet';
      case 'enquiryImport':
        return 'Import Enquiries';
      case 'bookingImport':
        return 'Import Bookings';
      case 'Parking-Unit':
        return 'Import Parking Plan';
      default:
        return 'Import Floor Plan';
    }
  }

  getSampleFileUrl(): string {
    const baseExcelUrl = `${this.storageUrl}/excel`;

    switch (this.data?.for) {
      case 'projectLead':
        return `${baseExcelUrl}/lead_sheet.xlsx`;
      case 'enquiryImport':
        return `${baseExcelUrl}/sample_project_enquiries_formatted (1).xlsx`;
      case 'bookingImport':
        return `${baseExcelUrl}/sample_booking_upload_final.xlsx`;
      case 'Parking-Unit':
        return `${baseExcelUrl}/sample_parking_plan.xlsx`;
      default:
        return `${baseExcelUrl}/floor_plan.xlsx`;
    }
  }

  getSampleFileName(): string {
    switch (this.data?.for) {
      case 'projectLead':
        return 'lead_sheet.xlsx';
      case 'enquiryImport':
        return 'sample_enquiries.xlsx';
      case 'Parking-Unit':
        return 'sample_parking_plan.xlsx';
      case 'receiptsImport':
        return 'sample_receipts.xlsx';
      default:
        return 'floor_plan.xlsx';
    }
  }

  getSampleFileLabel(): string {
    switch (this.data?.for) {
      case 'projectLead':
        return 'Download Lead Sheet';
      case 'enquiryImport':
        return 'Download Enquiries Template';
      case 'Parking-Unit':
        return 'Download Parking Plan Template';
      case 'receiptsImport':
        return 'Download Receipts Template';
      default:
        return 'Download Floor Plan';
    }
  }

  submitFile(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please select a file to upload.', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (!this.data?.API_URL) {
      console.error('Missing API_URL for import dialog.');
      this.snackBar.open('Configuration error: missing API URL.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.loading = true;
    const formData = new FormData();

    // Append the selected file
    formData.append('file', this.selectedFile);

    // Normalize and append IDs
    const rawProjectId = this.excelUploadForm.get('project_id')?.value;
    const rawSalesExecId = this.excelUploadForm.get('sales_executive_id')?.value;

    const projectId = this.normalizeSingleSelectValue(rawProjectId);
    const salesExecId = this.normalizeSingleSelectValue(rawSalesExecId);

    if (projectId) {
      formData.append('project_id', projectId.toString());
    }

    if (salesExecId) {
      formData.append('sales_executive_id', salesExecId.toString());
    }

    if (this.userId) {
      formData.append('created_by', this.userId.toString());
      formData.append('user_id', this.userId.toString());
    }

    if (this.data?.for === 'Floor-unit' && this.userId) {
      // Kept for backward compatibility with existing API expectations
      formData.append('user_id', this.userId.toString());
    }

    this.http
      .post<Record<string, unknown>>(
        `${this.baseUrl}/${this.data.API_URL}`,
        formData
      )
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          if (this.data?.for === 'projectLead') {
            this.dialog.open(ImportLeadsuccessHistoryComponent, {
              autoFocus: false,
              data: res,
            });
          } else {
            this.dialog.open(SuccessDialogComponent, {
              autoFocus: false,
              data: { message: res?.message },
            });
          }

          this.dialogRef.close(Boolean(res?.success));
        },
        error: (err) => {
          console.error('Error:', err);
          this.snackBar.open('Upload failed. Please try again.', 'Close', {
            duration: 3000,
          });
          this.dialogRef.close(false);
        },
      });
  }
}
