import { Component, Inject } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { environment } from '../../../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../../../Common/template/template.component';
import { IndianCurrencyPipe } from '../../../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { TruncatePipe } from '../../../../../../../Pipes/truncate.pipe';

@Component({
  selector: 'app-edit-paymentstage-dialog',
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
    IndianCurrencyPipe,
    ActionColumnComponent,
    ReusableTableComponent,
  ],
  templateUrl: './edit-paymentstage-dialog.component.html',
  styleUrl: './edit-paymentstage-dialog.component.scss',
})
export class EditPaymentstageDialogComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false;
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');

  // File handling
  architectureLetterFile: File | null = null;
  siteWorkProgressFile: File | null = null;
  existingArchitectureLetter: string | null = null;
  existingSiteWorkProgress: string | null = null;

  addUpdateAgreementDetailsForm = new FormGroup({
    payment_stage_id: new FormControl(''),
    project_id: new FormControl('', Validators.required),
    wing_id: new FormControl('', Validators.required),
    payment_stage: new FormControl('', Validators.required),
    percentage: new FormControl(0, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    stage_date: new FormControl<Date | null>(null, Validators.required),
    status: new FormControl(0, Validators.required),
    actual_date: new FormControl<Date | null>(null),
    architecture_letter: new FormControl(''),
    site_work_progress: new FormControl(''),
    updated_by: new FormControl(this.userId),
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<EditPaymentstageDialogComponent>,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.data.paymentStage) {
      this.populateForm(this.data.paymentStage);
    }
    if (this.data.projectId) {
      this.addUpdateAgreementDetailsForm.patchValue({
        project_id: this.data.projectId,
        wing_id: this.data.wingId,
      });
    }
  }

  populateForm(data: any): void {
    this.addUpdateAgreementDetailsForm.patchValue({
      payment_stage_id: data.payment_stage_id,
      project_id: data.project_id,
      wing_id: data.wing_id,
      payment_stage: data.payment_stage,
      percentage: data.percentage,
      stage_date: new Date(data.stage_date),
      status: data.status,
      actual_date: data.actual_date ? new Date(data.actual_date) : null,
      updated_by: this.userId,
    });

    // Set existing files
    this.existingArchitectureLetter = data.architecture_letter;
    this.existingSiteWorkProgress = data.site_work_progress;
  }

  onFileSelected(event: any, field: string): void {
    const file: File = event.target.files[0];
    if (file) {
      if (field === 'architecture_letter') {
        this.architectureLetterFile = file;
      } else if (field === 'site_work_progress') {
        this.siteWorkProgressFile = file;
      }
    }
  }

onSave(): void {
  if (this.addUpdateAgreementDetailsForm.valid) {
    this.loading = true;
    const formData = new FormData();
    const formValue = this.addUpdateAgreementDetailsForm.value;

    // Format dates consistently
    const formatDate = (date: Date | null): string => {
      if (!date) return '';
      const formatted = this.pipe.transform(date, 'yyyy-MM-dd');
      return formatted || '';
    };

    // Append all non-file, non-date values first
    Object.keys(formValue).forEach((key) => {
      if (key !== 'stage_date' && key !== 'actual_date' && 
          key !== 'architecture_letter' && key !== 'site_work_progress') {
        const value = formValue[key as keyof typeof formValue];
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      }
    });

    // Handle dates explicitly
    const stageDate = this.addUpdateAgreementDetailsForm.get('stage_date')?.value as Date | null;
    const actualDate = this.addUpdateAgreementDetailsForm.get('actual_date')?.value as Date | null;
    
    formData.append('stage_date', formatDate(stageDate));
    formData.append('actual_date', formatDate(actualDate));

    // Append files if selected
    if (this.architectureLetterFile) {
      formData.append('architecture_letter', this.architectureLetterFile);
    } else if (this.existingArchitectureLetter) {
      formData.append('architecture_letter', this.existingArchitectureLetter);
    }

    if (this.siteWorkProgressFile) {
      formData.append('site_work_progress', this.siteWorkProgressFile);
    } else if (this.existingSiteWorkProgress) {
      formData.append('site_work_progress', this.existingSiteWorkProgress);
    }

    console.log('FormData contents:'); // For debugging
    formData.forEach((value, key) => {
      console.log(key, value);
    });

    this.http.post(`${this.baseUrl}/edit_payment_stage`, formData).subscribe({
      next: (res: any) => {
        this.snackBar.open('Payment stage updated successfully!', 'Close', {
          duration: 3000,
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error:', err); // Debugging
        this.snackBar.open('Error updating payment stage', 'Close', {
          duration: 3000,
        });
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
}
