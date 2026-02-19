import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-add-brokerage-slabs',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-brokerage-slabs.component.html',
  styleUrl: './add-brokerage-slabs.component.scss',
})
export class AddBrokerageSlabsComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allConfiguration: any[] = []; // Will hold project data
  allProjectPhases: any[] = []; // Will hold project data
  allcpList: any[] = []; // Will hold project data
  allBrokerageunitList: any[] = []; // Will hold project data
  brokerageUnitList: any[] = []; // Will hold project data
  pipe = new DatePipe('en-US');
  preferenceDropdown: any[] = [];
  projectsList: any[] = [];
  addBrokerageSlabsList: FormGroup[] = [];
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    // Injected dialog data
    private dialogRef: MatDialogRef<AddBrokerageSlabsComponent> // Reference to the dialog
  ) {
    this.addNewForm();
  }
  ngOnInit(): void {
    console.log('l;skgl',this.data);
    
    this.fetchAllProjects();
    this.fechpreferencedropdown(this.data.projectid);
    if (this.data?.rowData?.brokerage_slab_id) {
      // Editing existing record
      this.addBrokerageSlabsList = []; // clear any existing forms
      this.addNewForm(this.data.rowData); // pass rowData to patch values
    } else {
      // Adding new record
      this.addBrokerageSlabsList = [];
      this.addNewForm(); // empty form
    }
  
    if (this.data.projectid) {
      this.fetchAllData();
    }
    const firstForm = this.addBrokerageSlabsList[0];
    firstForm?.get('project_id')?.valueChanges.subscribe((projectID: any) => {
      if (projectID || this.data.projectid) {
        this.fechpreferencedropdown(projectID || this.data.projectid);
      }
    });
  }
  
  fetchAllProjects(): void {

    const payload = {
      user_id:  this.userId,
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.projectsList = res;
        }
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  addNewForm(rowData: any = null) {
    const form = new FormGroup({
      user_id: new FormControl(this.userId),
      phase_id: new FormControl(rowData?.phase_id || this.data?.phaseID || null),
      project_config_id: new FormControl(
        rowData?.project_config_id 
          ? (Array.isArray(rowData.project_config_id) ? rowData.project_config_id : [rowData.project_config_id])
          : []
      ),
      project_id: new FormControl(this.data.projectid),
      cp_type_id: new FormControl(rowData?.cp_type_id || this.data.cpTypeID || null),
      valid_from: new FormControl(rowData?.valid_from || null),
      valid_till: new FormControl(rowData?.valid_till || null),
      brokerage_slab_from: new FormControl(rowData?.brokerage_slab_from || null),
      retro_type_id: new FormControl(rowData?.retro_type_id === 1), // checkbox expects boolean
      brokerage_slab_to: new FormControl(rowData?.brokerage_slab_to || null),
      brokerage_unit_id: new FormControl(rowData?.brokerage_unit_id || null),
      value: new FormControl(rowData?.value || null),
      value_unit_id: new FormControl(rowData?.value_unit_id || null),
      extra_bonus: new FormControl(rowData?.extra_bonus || null),
      deal_value: new FormControl(null),
      active_status_id: new FormControl(rowData?.active_status_id ?? 1),
    });
  
    this.addBrokerageSlabsList.push(form);
  }
  
  
  removeForm(index: number) {
    // Remove the form at the specified index
    this.addBrokerageSlabsList.splice(index, 1);
  }

  onSubmit() {
    const { apiUrl, successMessage, project_config_id } = this.data;
    const formData = new FormData();
  
    this.addBrokerageSlabsList.forEach((form, index) => {
      const formValues = form.value;
      const nonArrayKeys = [
        'user_id',
        'phase_id',
        'project_config_id',
        'project_id',
        'extra_bonus',

        'cp_type_id',
        'retro_type_id'
      ];
  
      const isUpdate = !!this.data?.rowData?.brokerage_slab_id;
  
      nonArrayKeys.forEach((key) => {
        if (formValues[key] !== undefined) {
          let value;
          if (key === 'retro_type_id') {
            value = formValues[key] ? '1' : '0';
          } else if (formValues[key] === null || formValues[key] === '') {
            value = '';
          } else {
            value = parseInt(formValues[key], 10).toString();
          }
          formData.append(key, value);
        }
      });
  
      if (project_config_id) {
        formData.append('project_config_id', parseInt(project_config_id, 10).toString());
      }
  
      if (isUpdate) {
        formData.append('brokerage_slab_id', this.data.rowData.brokerage_slab_id.toString());
        formData.append('updated_by', this.userId.toString());
      }
  
      ['valid_from', 'valid_till'].forEach((key) => {
        if (formValues[key]) {
          formData.append(
            key,
            this.pipe.transform(new Date(formValues[key]), 'yyyy-MM-dd') || ''
          );
        }
      });
  
      Object.keys(formValues).forEach((key) => {
        if (!nonArrayKeys.includes(key) && key !== 'valid_from' && key !== 'valid_till') {
          const value = formValues[key];
          if (value != null) {
                         if (Array.isArray(value)) {
               value.forEach((v, i) => {
                 if (v === null || v === '') {
                   formData.append(isUpdate ? key : `${key}[${i}]`, '');
                 } else {
                   const parsedValue = parseFloat(v);
                   if (!isNaN(parsedValue)) {
                     formData.append(isUpdate ? key : `${key}[${i}]`, parsedValue.toString());
                   }
                 }
               });
             } else {
               if (value === null || value === '') {
                 formData.append(isUpdate ? key : `${key}[${index}]`, '');
               } else {
                 const parsedValue = parseFloat(value);
                 if (!isNaN(parsedValue)) {
                   formData.append(isUpdate ? key : `${key}[${index}]`, parsedValue.toString());
                 }
               }
             }
          }
        }
      });
    });
  
    // Send HTTP request
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      () => {
        this.snackBar.open(successMessage, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      () =>
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        })
    );
  }
  fechpreferencedropdown(projectID: any): void {
    this.http
      .post(`${this.baseUrl}/web_config_dropdown`, { project_id: projectID || null })
      .subscribe({
        next: (res: any) => {
          this.preferenceDropdown = res;
        },
        error: () => {},
      });
  }
  fetchAllData(): void {
    const phaseId = null; // Replace with actual selected phase_id if necessary.

    forkJoin({
      cpTypes: this.http.get(`${this.baseUrl}/cp_type_dropdown`),
      projectPhases: this.http.post(`${this.baseUrl}/fetch_phases`, {
        project_id: this.data.projectid,
      }),
      projectConfiguration: this.http.post(`${this.baseUrl}/config_dropdown`, {
        project_id: this.data.projectid,
      }),
      brokerageSlabUnit: this.http.get(
        `${this.baseUrl}/brokerage_value_unit_dropdown`
      ),
      brokerageUnits: this.http.get(`${this.baseUrl}/brokerage_unit_dropdown`),
    }).subscribe({
      next: (responses: any) => {
        this.allcpList = responses.cpTypes;
        this.allProjectPhases = responses.projectPhases;

        this.allConfiguration = responses.projectConfiguration;
        this.allBrokerageunitList = responses.brokerageSlabUnit;
        this.brokerageUnitList = responses.brokerageUnits;
      },
      error: (err) => {
        console.error('Error fetching data', err);
        this.snackBar.open('Unable to fetch data.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
