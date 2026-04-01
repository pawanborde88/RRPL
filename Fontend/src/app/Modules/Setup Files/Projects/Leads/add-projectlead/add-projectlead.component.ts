import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { catchError, forkJoin, of } from 'rxjs';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';

@Component({
  selector: 'app-add-projectlead',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent

  ],
  templateUrl: './add-projectlead.component.html',
  styleUrl: './add-projectlead.component.scss',
})
export class AddProjectleadComponent implements OnInit {
  private baseUrl = environment.API_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  private userId = Number(sessionStorage.getItem('session_id'));

  // Data arrays
  sourcesList: any[] = [];
  statusDropdown: any[] = [];
  allLeadLevels: any[] = [];
  projectsList: any[] = [];
  confiList: any[] = [];
  sourceDetailedList: any[] = [];
  allDataFromList: any[] = [];
  allChannelPartnerList: any[] = [];

  // State
  loading = false;
  isEditMode = false;
  pipe = new DatePipe('en-US');
  minDate: Date = new Date();
  maxDate: Date = new Date();

  // Form
  addProjectLeadForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddProjectleadComponent>
  ) {
    this.maxDate.setDate(this.maxDate.getDate() + 30);
    this.isEditMode = !!this.data?.rowData?.project_lead_id;
    this.initializeForm();
  }

  ngOnInit(): void {
    this.fetchAllDropdowns();
    this.setupFormListeners();

    if (this.isEditMode) {
      this.fetchSingleLead(this.data.rowData.project_lead_id);
      this.toggleFormFieldsForRole();
    }
  }

  private initializeForm(): void {
    const currentDate = this.pipe.transform(new Date(), 'yyyy-MM-dd');
    const currentTime = this.pipe.transform(new Date(), 'HH:mm');

    this.addProjectLeadForm = new FormGroup({
      project_id: new FormControl([], Validators.required),
      date: new FormControl(currentDate, Validators.required),
      customer_name: new FormControl(null, Validators.required),
      status_id: new FormControl(null, Validators.required),
      mobile_no: new FormControl('', [
        Validators.required,
        Validators.pattern(/^\d{10}$/)
      ]),
      alternate_mob_no: new FormControl(null),
      whatsapp_no: new FormControl(null),
      email_id: new FormControl('', Validators.email),
      project_configuration_id: new FormControl([], Validators.required),
      is_site_visited: new FormControl(false),
      site_visited_date: new FormControl(null),
      is_booked: new FormControl(false),
      remark: new FormControl(null),
      telecaller_id: new FormControl(null),
      sales_executive_id: new FormControl(null),
      source_id: new FormControl(null, Validators.required),
      source_detail_id: new FormControl(null),
      channel_partner_id: new FormControl(null),
      source_description: new FormControl(null),
      data_from_id: new FormControl(null),
      created_by: new FormControl(this.userId),
      updated_by: new FormControl(this.userId),
      project_lead_id: new FormControl(this.data?.rowData?.project_lead_id || null)
    });
  }

  private setupFormListeners(): void {
    // Source change listener
    this.addProjectLeadForm.get('source_id')?.valueChanges.subscribe((sourceId) => {
      this.updateSourceValidators(sourceId);
      if (sourceId) {
        this.fetchAllSourceDetails(sourceId);
      } else {
        this.sourceDetailedList = [];
      }
    });

    // Project change listener for configurations
    this.addProjectLeadForm.get('project_id')?.valueChanges.subscribe((projectValue) => {
      const projectId = this.extractProjectId(projectValue);
      if (projectId) {
        this.fetchProjectConfig(projectId);
      } else {
        this.confiList = [];
        this.addProjectLeadForm.get('project_configuration_id')?.setValue([]);
      }
    });
  }

  private extractProjectId(value: any): number | null {
    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    } else if (typeof value === 'number') {
      return value;
    }
    return null;
  }

  private toggleFormFieldsForRole(): void {
    const shouldEnable = !(this.isEditMode && this.roleId === 2);
    this.toggleFormFields(shouldEnable);
  }

  private toggleFormFields(enable: boolean): void {
    const fieldsToToggle = [
      'project_id',
      'sales_executive_id',
      'channel_partner_id',
      'source_id',
    ];

    fieldsToToggle.forEach(field => {
      const control = this.addProjectLeadForm.get(field);
      if (control) {
        enable ? control.enable() : control.disable();
      }
    });
  }

  private updateSourceValidators(sourceId: number): void {
    const channelPartnerControl = this.addProjectLeadForm.get('channel_partner_id');
    const sourceDetailControl = this.addProjectLeadForm.get('source_detail_id');

    // Clear existing validators
    channelPartnerControl?.clearValidators();
    sourceDetailControl?.clearValidators();

    if (sourceId === 3) {
      // For source_id = 3 (Channel Partner), channel_partner_id is required
      channelPartnerControl?.setValidators(Validators.required);
      sourceDetailControl?.setValue(null);
    } else if (sourceId) {
      // For other sources, source_detail_id is required
      sourceDetailControl?.setValidators(Validators.required);
      channelPartnerControl?.setValue(null);
    }

    // Update validity
    channelPartnerControl?.updateValueAndValidity();
    sourceDetailControl?.updateValueAndValidity();
  }

  // API Calls
  private fetchAllDropdowns(): void {
    this.fetchAllProjects();
    this.fetchAllLeadLevels();
    this.fetchAllDataFromList();
    this.fetchStatusDropdown();
    this.fetchAllSourceList();
  }

  private fetchAllProjects(): void {
    this.loading = true;
    const payload = this.roleId === 2 ? { user_id: null } : { user_id: this.userId };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        this.projectsList = res || [];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error fetching projects:', error);
        this.snackBar.open('Unable to fetch projects.', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private fetchAllLeadLevels(): void {
    this.http.get<any[]>(`${this.baseUrl}/fetch_lead_level`).pipe(
      catchError(() => {
        this.snackBar.open('Failed to fetch lead levels.', 'Close', { duration: 3000 });
        return of([]);
      })
    ).subscribe((response) => {
      this.allLeadLevels = response || [];
    });
  }

  private fetchProjectConfig(projectId: number): void {
    this.http.post(`${this.baseUrl}/web_config_dropdown`, { project_id: projectId }).subscribe({
      next: (res: any) => {
        this.confiList = res || [];
      },
      error: (error: any) => {
        console.error('Error fetching project config:', error);
        this.snackBar.open('Unable to fetch project configurations.', 'Close', { duration: 3000 });
      }
    });
  }

  private fetchAllDataFromList(): void {
    this.http.get<any[]>(`${this.baseUrl}/data_from_dropdown`).pipe(
      catchError(() => {
        this.snackBar.open('Failed to fetch data sources.', 'Close', { duration: 3000 });
        return of([]);
      })
    ).subscribe((response) => {
      this.allDataFromList = response || [];
    });
  }

  private fetchStatusDropdown(): void {
    this.http.get<any[]>(`${this.baseUrl}/enq_status_dropdown`).pipe(
      catchError(() => {
        this.snackBar.open('Failed to fetch status dropdown.', 'Close', { duration: 3000 });
        return of([]);
      })
    ).subscribe((response) => {
      this.statusDropdown = response || [];
    });
  }

  private fetchAllSourceList(): void {
    this.http.get(`${this.baseUrl}/source_dropdown`).subscribe({
      next: (res: any) => {
        this.sourcesList = res || [];
      },
      error: () => {
        this.snackBar.open('Unable to fetch source details.', 'Close', { duration: 3000 });
      }
    });
  }

  private fetchAllSourceDetails(sourceId: number): void {
    this.http.post(`${this.baseUrl}/source_detail_dropdown`, { source_id: sourceId }).subscribe({
      next: (res: any) => {
        this.sourceDetailedList = (res || []).map((item: any) => ({
          ...item,
          full_name: `${item.firm_name} --(${item.cp_owner})`
        }));
      },
      error: () => {
        this.snackBar.open('Unable to fetch source details.', 'Close', { duration: 3000 });
      }
    });
  }

  private fetchSingleLead(projectLeadId: number): void {
    this.loading = true;
    this.http.post(`${this.baseUrl}/fetch_single_lead`, { project_lead_id: projectLeadId })
      .subscribe({
        next: (res: any) => {
          if (res?.data) {
            this.patchFormWithLeadData(res.data);
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error fetching lead:', error);
          this.snackBar.open('Error fetching lead data, please try later', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  private patchFormWithLeadData(leadData: any): void {
    const formData = {
      project_lead_id: leadData.project_lead_id,
      project_id: this.extractFirstValue(leadData.project_id),
      date: this.formatDate(leadData.date),
      customer_name: leadData.customer_name,
      status_id: leadData.status_id,
      mobile_no: leadData.mobile_no?.toString() || '',
      alternate_mob_no: leadData.alternate_mob_no?.toString() || '',
      whatsapp_no: leadData.whatsapp_no?.toString() || '',
      email_id: leadData.email_id,
      project_configuration_id: this.ensureArray(leadData.project_configuration_id),
      is_site_visited: leadData.is_site_visited || false,
      site_visited_date: this.formatDate(leadData.site_visited_date),
      is_booked: leadData.is_booked || false,
      remark: leadData.remark,
      telecaller_id: this.extractFirstValue(leadData.telecaller_id),
      sales_executive_id: leadData.sales_executive_id,
      source_id: leadData.source_id,
      source_detail_id: leadData.source_detail_id,
      channel_partner_id: leadData.channel_partner_id,
      source_description: leadData.source_description,
      data_from_id: leadData.data_from_id
    };

    this.addProjectLeadForm.patchValue(formData);
    this.addProjectLeadForm.markAsUntouched();

    // Trigger source validators after patching
    if (leadData.source_id) {
      this.updateSourceValidators(leadData.source_id);
    }
  }

  private extractFirstValue(value: any): any {
    if (Array.isArray(value) && value.length > 0) {
      return value[0];
    }
    return value;
  }

  private ensureArray(value: any): any[] {
    if (Array.isArray(value)) {
      return value;
    } else if (value != null) {
      return [value];
    }
    return [];
  }

  private formatDate(date: any): string | null {
    if (!date) return null;
    return this.pipe.transform(date, 'yyyy-MM-dd');
  }

  // Public Methods
  onPartnerSearch(searchText: string): void {
    const trimmedSearch = searchText.trim();
    if (trimmedSearch.length < 3) {
      this.allChannelPartnerList = [];
      return;
    }

    this.http.post(`${this.baseUrl}/channel_partner_dropdown`, { firm_name: trimmedSearch })
      .subscribe({
        next: (res: any) => {
          this.allChannelPartnerList = (res || []).map((item: any) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner})`
          }));
        },
        error: () => {
          this.snackBar.open('Unable to fetch channel partners.', 'Close', { duration: 3000 });
        }
      });
  }

  onSubmit(): void {
    if (this.addProjectLeadForm.invalid) {
      this.markInvalidControlsAsTouched();
      return;
    }

    const { apiUrl } = this.data;
    const formData = this.prepareFormData();

    this.loading = true;
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe({
      next: (res: any) => {
        this.dialog.open(SuccessDialogComponent, {
          autoFocus: false,
          data: { message: res.message || 'Operation successful' }
        });
        this.dialogRef.close(true);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Submission error:', error);
        this.snackBar.open('Something went wrong. Please try again.', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  private prepareFormData(): any {
    const formValue = this.addProjectLeadForm.getRawValue();

    return {
      ...formValue,
      date: this.pipe.transform(formValue.date, 'yyyy-MM-dd'),
      site_visited_date: this.pipe.transform(formValue.site_visited_date, 'yyyy-MM-dd'),
      project_id: this.ensureArray(formValue.project_id),
      ...(this.isEditMode && {
        updated_by: this.userId,
        project_lead_id: this.data.rowData.project_lead_id
      })
    };
  }

  private markInvalidControlsAsTouched(): void {
    Object.values(this.addProjectLeadForm.controls).forEach(control => {
      if (control.invalid) {
        control.markAsTouched();
      }
    });
  }

  getInvalidFields(): string[] {
    const invalidFields: string[] = [];
    const form = this.addProjectLeadForm;

    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control?.invalid && control?.errors?.['required']) {
        const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        invalidFields.push(fieldName);
      }
    });

    return invalidFields;
  }

  // Getters for template
  get isChannelPartnerSource(): boolean {
    return this.addProjectLeadForm.get('source_id')?.value === 3;
  }

  get isProjectDisabled(): boolean {
    return this.isEditMode && this.roleId === 2;
  }

  // Methods to sanitize number inputs
  onMobileNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    input.value = sanitized;
    this.addProjectLeadForm.get('mobile_no')?.setValue(sanitized, { emitEvent: false });
  }

  onAlternateMobileNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    input.value = sanitized;
    this.addProjectLeadForm.get('alternate_mob_no')?.setValue(sanitized, { emitEvent: false });
  }

  onWhatsAppNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    input.value = sanitized;
    this.addProjectLeadForm.get('whatsapp_no')?.setValue(sanitized, { emitEvent: false });
  }
}