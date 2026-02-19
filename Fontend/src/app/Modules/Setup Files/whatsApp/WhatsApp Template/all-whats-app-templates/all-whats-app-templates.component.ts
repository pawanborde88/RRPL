import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { Router } from 'express';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { ResetUserPasswordComponent } from '../../../USERS/add-user/Reset Password/reset-user-password/reset-user-password.component';
import { UserProjctsComponent } from '../../../USERS/all-users/User Projects/user-projcts/user-projcts.component';
import { InactiveUserComponent } from '../../../USERS/inactive-user/inactive-user.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddWhatsAppTemplateDialogComponent } from '../add-whats-app-template-dialog/add-whats-app-template-dialog.component';

@Component({
  selector: 'app-all-whats-app-templates',
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
    ActionColumnComponent,
    ReusableTableComponent,
    // Add the pipe here
  ],
  templateUrl: './all-whats-app-templates.component.html',
  styleUrl: './all-whats-app-templates.component.scss'
})
export class AllWhatsAppTemplatesComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  storageUrl = environment.STORAGE_URL;
  selectedUsers: any[] = [];
  selectedUser: any[] = [];

  loading = false;
  baseUrl = environment.API_URL;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
  ) {}
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
      label: 'Sr. No',
      type: 'index',
    },
    { key: 'template_name', label: 'Template Name' },
    { key: 'project_name', label: 'Project' },
    { key: 'module_name', label: 'Module' },
    { key: 'language_code', label: 'Language' },
    { 
      key: 'created_at', 
      label: 'Created At', 
      type: 'date' 
    },
    { 
      key: 'updated_at', 
      label: 'Updated At', 
      type: 'date' 
    },
    { key: 'created_by_name', label: 'Created By' },
    // You might want to add updated_by_name if available
    // { key: 'updated_by_name', label: 'Updated By' },
  ];

  columnKeys: string[] = this.displayedColumns.map((col) => col.key);
  selectedColumns = this.displayedColumns.map((col) => col.key); // Default select all columns

  onColumnSelectionChange() {
    // Update columnKeys based on selected columns
    this.columnKeys = this.selectedColumns;
  }
  headerButtons = [
    
    {
      label: 'Add WhatsApp Template',
      icon: 'view_timeline',
      color: 'primary',
      disabled: () => false,
      action: () => this.addWhatAppTempalte(),
      show: () => true,

    },
    
 
  ];
  ngOnInit(): void {
    this.fetchAllWhatsAppTemplates();
  }
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Source',
      action: 'leadAssign',
      color: 'primary',
    },
    ...(this.roleId === 2
      ? [
          {
            icon: 'delete',
            tooltip: 'Delete Project',
            action: 'deleteWhatAppTemplate',
            color: 'warn',
          },
        ]
      : []),
  ];
  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'leadAssign':
        this.openAddWhatsAppTemplateDialog('edit', row);
        break;
      case 'deleteWhatAppTemplate':
        this.deleteSources(row.whatsapp_template_setup_id);
        break;
      default:
        break;
    }
  }
  openAddWhatsAppTemplateDialog(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddWhatsAppTemplateDialogComponent, {
      width: '500px',
      data: { action, row },
    });
  }
  deleteSources(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete whatsapp template?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          whatsapp_template_setup_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_whatsapp_template`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open(data.message, 'Close', {
                duration: 3000,
              });
              this.fetchAllWhatsAppTemplates(); // Ensure this is called here to update the teams
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete Team.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
  fetchAllWhatsAppTemplates(): void {
    this.loading = true;
    this.http.post(`${this.baseUrl}/get_all_whatsapp_templates`, { project_id: null }).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource(res.data);
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch project Users.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  bookingActions = [
    {
      action: 'deleteUser',
      icon: 'delete',
      tooltip: 'Delete User',
      color: 'warn',
          show: () => [1, 2, 4].includes(this.roleId) // Only show for specific roles

    },
  ];


 



  addWhatAppTempalte() {
    const dialogRef = this.dialog.open(AddWhatsAppTemplateDialogComponent, {
      minWidth: '40vw',
     
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllWhatsAppTemplates();
      }
    });
  }


}
