import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../../environments/environment';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ResetUserPasswordComponent } from '../../../add-user/Reset Password/reset-user-password/reset-user-password.component';
import { ReusableTableComponent } from '../../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ConfirmDialogComponent } from '../../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-projcts',
  standalone: true,
  imports: [ CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,     ReusableTableComponent,
    ReactiveFormsModule,
    FormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './user-projcts.component.html',
  styleUrl: './user-projcts.component.scss',
})
export class UserProjctsComponent implements OnInit {
  loading: boolean = false;
  baseUrl = environment.API_URL;
  showAssignProjectForm = false; // Add this property to control form visibility
  userId = Number(sessionStorage.getItem('session_id'));

  projectsList: any[] = [];
  roleId: number = Number(sessionStorage.getItem('role_id'));
  searchQuery: string = '';
  assignedProjectIds: number[] = []; // Store assigned project IDs

  // Getter to return filtered projects list (excluding already assigned projects)
  get availableProjectsList(): any[] {
    if (this.assignedProjectIds.length === 0) {
      return this.projectsList;
    }
    const filtered = this.projectsList.filter(
      (project: any) => !this.assignedProjectIds.includes(project.project_id)
    );
    console.log('Available Projects (excluding assigned):', filtered.length, 'out of', this.projectsList.length);
    return filtered;
  }

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns = [
    {
      key: 'actions',
      label: '',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
        {
      key: 'sr_no',
      label: 'Sr. No.',
      type: 'index',
    },
    { key: 'project_name', label: 'Projects' }
  ];
  get columnKeys(): string[] {
    return this.displayedColumns.map(col => col.key);
  }

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialog: MatDialog,

    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UserProjctsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,   ) {

  }
  headerButtons = [
    {
     label: 'Assign Project',
     icon: 'drafts',
     color: 'primary',
     disabled: () => false,
     action: () => this.toggleAssignProjectForm(), // Update action to toggle form
     show: () => true,
    },
    {
      label: 'Unassign Project',
      icon: 'drafts',
      color: 'primary',
      disabled: () => false,
      action: () => this.unAssignProjects(), // Update action to toggle form
      show: () => true,

    },
   
 ];
 unAssignProjects(): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    minWidth: '25vw',
    data: { message: 'Are you sure you want to unassign this project?' },
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.http
        .post(`${this.baseUrl}/delete_sales_executive`, {
          // Send only the array of assign_project_id values
          assign_project_id: this.selectedProjects.map(p => p.assign_project_id)
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Project unassigned successfully', 'Close', {
              duration: 3000,
            });
            this.fetchAllUserProjects();
          },
          error: () => {
            this.snackBar.open('Unable to unassign project.', 'Close', {
              duration: 3000,
            });
          },
        });
    }
  });
}
 addTokenForm = new FormGroup({
  project_id: new FormControl<any[]>([], Validators.required), // This expects an array
    user_id: new FormControl<any[]>([], Validators.required), // This expects an array
   created_by: new FormControl(),
  });
  ngOnInit(): void {
    console.log('UserProjctsComponent initialized with data:', this.data);
    this.fetchAllprojectsList();
    this.fetchAllUserProjects();
  }
  toggleAssignProjectForm(): void {
    // If opening the form, ensure projects list is loaded
    if (!this.showAssignProjectForm && this.projectsList.length === 0) {
      this.fetchAllprojectsList();
    }
    
    this.showAssignProjectForm = !this.showAssignProjectForm;
    
    if (this.showAssignProjectForm) {
      // Reset form first to clear any previous values
      this.addTokenForm.reset();
      
      // Initialize form with user_id and created_by, but leave project_id empty for new selection
      const userId = this.data?.userId?.[0]?.user_id;
      if (!userId) {
        this.snackBar.open('User ID is missing. Cannot assign projects.', 'Close', { duration: 3000 });
        this.showAssignProjectForm = false;
        return;
      }
      
      this.addTokenForm.patchValue({
        project_id: [], // Start with empty selection - user should select NEW projects
        user_id: [userId],
        created_by: this.userId
      });
      
      // Mark form as pristine and untouched
      this.addTokenForm.markAsPristine();
      this.addTokenForm.markAsUntouched();
      
      // Update form validity
      this.addTokenForm.updateValueAndValidity();
    } else {
      this.addTokenForm.reset(); // Reset form when closing
    }
  }
  selectedProjects: any[] = [];

  // Getter to check if submit button should be enabled
  get isAssignButtonDisabled(): boolean {
    // Don't show button if form is not visible
    if (!this.showAssignProjectForm) {
      return true;
    }
    
    // Disable if loading
    if (this.loading) {
      return true;
    }
    
    const projectIdControl = this.addTokenForm.get('project_id');
    const projectIdValue = projectIdControl?.value;
    
    // Check if project_id has a value (array with at least one item)
    if (Array.isArray(projectIdValue)) {
      return projectIdValue.length === 0;
    }
    
    // If not an array, check if it has a value
    return !projectIdValue || projectIdValue === null || projectIdValue === undefined;
  }

  onCheckboxSelected(checked: boolean, row: any): void {
    if (checked) {
      // Add the row if it is not already selected
      if (!this.selectedProjects.some(p => p.assign_project_id === row.assign_project_id)) {
        this.selectedProjects.push(row);
      }
    } else {
      // Remove the row if it was deselected
      this.selectedProjects = this.selectedProjects.filter(p => p.assign_project_id !== row.assign_project_id);
    }
  }

  fetchAllUserProjects(): void {
    this.loading = true;
    const payload = { user_id: this.data?.userId?.[0]?.user_id };

    this.http.post<{ success: boolean; data: any[] }>(`${this.baseUrl}/fetch_users_project`, payload).subscribe({
      next: (res: any) => {
        console.log('API Response:', res);
        const projectsData = res?.data || [];
        console.log('Projects Data:', projectsData);
        console.log('Projects Data Length:', projectsData.length);
        
        // Create a new MatTableDataSource instance to ensure change detection
        this.dataSource = new MatTableDataSource(projectsData);
        this.assignedProjectIds = projectsData.map((project: any) => project.project_id);
        console.log('Assigned Project IDs updated:', this.assignedProjectIds);

        // Set sort and paginator after data is loaded
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching user projects:', err);
        this.loading = false;
        this.snackBar.open('Unable to fetch project modules.', 'Close', {
          duration: 3000
        });
      }
    });
  }
  fetchAllprojectsList(): void {
    this.http.get(`${this.baseUrl}/project_dropdown`).subscribe({
      next: (res: any) => {
        // Handle both array response and object with data property
        this.projectsList = Array.isArray(res) ? res : (res?.data || res || []);
        console.log('Projects List Loaded:', this.projectsList.length, 'projects');
      },
      error: (err: any) => {
        console.error('Error fetching projects list:', err);
        this.snackBar.open('Unable to fetch projects.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  assignProject(): void {
    // Check if form is valid
    if (this.addTokenForm.invalid) {
      this.snackBar.open('Please select at least one project to assign.', 'Close', { duration: 3000 });
      return;
    }

    const formValue = this.addTokenForm.value;
    console.log('Form Value:', formValue);
    
    // Get newly selected project IDs (ensure it's an array)
    const selectedProjectIds = Array.isArray(formValue.project_id) 
      ? formValue.project_id 
      : formValue.project_id ? [formValue.project_id] : [];
  
    console.log('Selected Project IDs:', selectedProjectIds);
    console.log('Assigned Project IDs:', this.assignedProjectIds);
  
    // Check if any projects are selected
    if (selectedProjectIds.length === 0) {
      this.snackBar.open('Please select at least one project to assign.', 'Close', { duration: 3000 });
      return;
    }

    // Filter out already assigned projects
    const newProjectIds = selectedProjectIds.filter(
      (projectId: number) => !this.assignedProjectIds.includes(projectId)
    );
  
    console.log('New Project IDs to assign:', newProjectIds);
  
    if (newProjectIds.length === 0) {
      this.snackBar.open('Selected projects are already assigned to this user.', 'Close', { duration: 3000 });
      return;
    }
  
    // Validate user_id
    const userId = this.data?.userId?.[0]?.user_id;
    if (!userId) {
      this.snackBar.open('User ID is missing. Please try again.', 'Close', { duration: 3000 });
      return;
    }
  
    const payload = {
      user_id: [userId],
      project_id: newProjectIds, // Send only new projects
      created_by: this.userId
    };
  
    console.log('Assign Project Payload:', payload);
  
    this.loading = true;
    this.http.post(`${this.baseUrl}/assign_project`, payload).subscribe({
      next: (res: any) => {
        console.log('Assign Project Response:', res);
        this.snackBar.open('Projects assigned successfully', 'Close', { duration: 3000 });
        this.fetchAllUserProjects(); // Refresh the list
        this.showAssignProjectForm = false;
        this.addTokenForm.reset(); // Reset form after successful assignment
        this.loading = false;
      },
      error: (err) => {
        console.error('Error assigning projects:', err);
        const errorMessage = err?.error?.message || 'Failed to assign projects';
        this.snackBar.open(errorMessage, 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}
