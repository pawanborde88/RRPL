import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';

@Component({
  selector: 'app-add-unit-noc',
  standalone: true,
  imports: [   CommonModule,
      RouterModule,
      BreadcrumbComponent,
      AngularMaterialModule,
      FormsModule,
      ReactiveFormsModule,
      TemplateComponent,
      AutocompleteReusableComponent],
  templateUrl: './add-unit-noc.component.html',
  styleUrl: './add-unit-noc.component.scss'
})
export class AddUnitNocComponent implements OnInit {

  allWingslist: any[] = [];
  allFloorUnits: any[] = [];
  projectsList: any[] = [];
  roleId = Number(sessionStorage.getItem('role_id')) || null
  userId = Number(sessionStorage.getItem('session_id')) || null;
  accountID = Number(sessionStorage.getItem('account_id')) || null;


   baseUrl = environment.API_URL;
    loading: boolean = false; // Initialize loading state
    storageUrl = environment.STORAGE_URL;

    constructor(
      private http: HttpClient,
      private dialog: MatDialog,
      private snackBar: MatSnackBar,
      private fetch: FetchFunctionsService
    ) {}
  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchAllWings(this.addnoc.value.project_id);
    this.fetchFloorUnit(this.addnoc.value.project_id);
  }
  
  addnoc = new FormGroup({
    project_id: new FormControl(null, Validators.required),
    wing_id: new FormControl(null, Validators.required),
    unit_id: new FormControl(null, Validators.required),
    bank_name: new FormControl(null, Validators.required),
    agreement_amount: new FormControl(null, Validators.required),
    sanction_amount: new FormControl(null, Validators.required),
    director_name: new FormControl(null, Validators.required),
    director_sign_date: new FormControl(null),
    noc_handover_date: new FormControl(null),
    remark: new FormControl(''),
    attachment: new FormControl(null)
  });
  unitList = [
    { unit_id: 1, unit_name: 'Unit A-101' },
    { unit_id: 2, unit_name: 'Unit A-102' },
    { unit_id: 3, unit_name: 'Unit B-201' },
    { unit_id: 4, unit_name: 'Unit B-202' }
  ];
  
  bankList = [
    { name: 'HDFC Bank Ltd' },
    { name: 'ICICI Bank' },
    { name: 'State Bank of India' },
    { name: 'Axis Bank' },
    { name: 'Kotak Mahindra Bank' }
  ];
  
  fetchFloorUnit(projectID: any): void {

    this.http.post(`${this.baseUrl}/floor_unit_dropdown`, {project_id: projectID}).subscribe({
      next: (res: any) => {
        this.allFloorUnits = res;
      
      },
      error: () => {
     
        this.snackBar.open('Unable to fetch project details.', 'Close', { duration: 3000 });
      },
    });
  }

  fetchAllWings(projectID: any): void {

    this.http.post(`${this.baseUrl}/wing_dropdown`, {project_id: projectID}).subscribe({
      next: (res: any) => {
        this.allWingslist = res;
      
      },
      error: () => {
     
        this.snackBar.open('Unable to fetch project details.', 'Close', { duration: 3000 });
      },
    });
  }

    
  fetchAllProjects(): void {
    this.http.get(`${this.baseUrl}/project_dropdown`).pipe(
      catchError((error) => {
        console.error('Error fetching projectsList:', error);
        return of([]);
      })
    ).subscribe((response) => {
      this.projectsList = response as any[];
    });
  }
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.addnoc.patchValue({
        attachment: file
      });
    }
  }
  submitNox(): void {
    
  }
  
}
