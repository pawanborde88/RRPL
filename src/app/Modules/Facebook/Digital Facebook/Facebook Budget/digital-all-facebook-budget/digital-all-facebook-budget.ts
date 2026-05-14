import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-digital-all-facebook-budget',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,
    TemplateComponent,
    BreadcrumbComponent
  ],
  templateUrl: './digital-all-facebook-budget.html',
  styleUrl: './digital-all-facebook-budget.scss',
})
export class DigitalAllFacebookBudgetComponent implements OnInit {
  
  // Form
  enquiryFilterForm: FormGroup = new FormGroup({});
  
  // Data properties
  projectsList: any[] = [];
  sourcesList: any[] = [];
  columnDefinitions: any[] = [];
  bookingActions: any[] = [];
  headerButtons: any[] = [];
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    this.initializeForm();
    this.initializeData();
  }
  
  private initializeForm(): void {
    this.enquiryFilterForm = this.fb.group({
      project_id: [[]],
      source_id: [null]
    });
  }
  
  private initializeData(): void {
    // Initialize projects list
    this.projectsList = [
      { project_id: 1, property_name: 'Project 1' },
      { project_id: 2, property_name: 'Project 2' }
    ];
    
    // Initialize sources list
    this.sourcesList = [
      { source_id: 1, source: 'Facebook' },
      { source_id: 2, source: 'Google' },
      { source_id: 3, source: 'Instagram' }
    ];
    
    // Initialize column definitions for AG Grid
    this.columnDefinitions = [
      { field: 'project_budget_setup_id', headerName: 'ID', width: 100 },
      { field: 'project_name', headerName: 'Project', width: 150 },
      { field: 'source_name', headerName: 'Source', width: 120 },
      { field: 'budget_amount', headerName: 'Budget Amount', width: 130 },
      { field: 'spent_amount', headerName: 'Spent Amount', width: 130 },
      { field: 'remaining_budget', headerName: 'Remaining', width: 120 },
      { field: 'created_date', headerName: 'Created Date', width: 150 }
    ];
    
    // Initialize booking actions
    this.bookingActions = [
      { action: 'edit', label: 'Edit', icon: 'edit' },
      { action: 'delete', label: 'Delete', icon: 'delete' },
      { action: 'view', label: 'View', icon: 'visibility' }
    ];
    
    // Initialize header buttons
    this.headerButtons = [
      { label: 'Add New Budget', action: 'add', icon: 'add', color: 'primary' },
      { label: 'Export', action: 'export', icon: 'download', color: 'accent' }
    ];
  }
  
  // Methods referenced in template
  fetchAllFaceBookList(): void {
    console.log('Fetching Facebook budget list...');
    // Implementation for fetching data
  }
  
  agGridPayload(): any {
    const formValues = this.enquiryFilterForm?.value;
    return {
      project_id: formValues?.project_id || [],
      source_id: formValues?.source_id || null
    };
  }
  
  onBookingAction(action: string, row: any): void {
    console.log('Action:', action, 'Row:', row);
    // Handle different actions like edit, delete, view
    switch (action) {
      case 'edit':
        // Handle edit action
        break;
      case 'delete':
        // Handle delete action
        break;
      case 'view':
        // Handle view action
        break;
    }
  }
}
