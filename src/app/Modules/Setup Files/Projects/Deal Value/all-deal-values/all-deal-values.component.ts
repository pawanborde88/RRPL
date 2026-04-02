import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AddDealValueComponent } from '../add-deal-value/add-deal-value.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-all-deal-values',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    TruncatePipe, // Add the pipe here
  ],
  templateUrl: './all-deal-values.component.html',
  styleUrl: './all-deal-values.component.scss',
})
export class AllDealValuesComponent implements OnInit{
   myForm: FormGroup;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  projectData: any = {};
  roleId = Number(sessionStorage.getItem('role_id')) || null;
  userId = Number(sessionStorage.getItem('session_id')) || null;
  allProjectDealValues: any[] = [];
  loading = false;
  projectsList: any[] = [];
  ngOnInit(): void {
    this.fetchAllProjects();
    
    // Listen for project selection changes
    this.myForm.get('project_id')?.valueChanges.subscribe((value:any) => {
      if (value) {
        this.fetchAllDealValues();
      }
    });
  }
constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.myForm = this.fb.group({
      project_id: ['']
    });
  }


// Get the selected project ID
get projectID() {
  return this.myForm.get('project_id')?.value;
}
  openAddDealDialog(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddDealValueComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Deal Value' : 'Edit Deal Value',
        apiUrl: action === 'add' ? 'add_deal_value' : 'edit_deal_value',
        successMessage:
          action === 'add'
            ? 'Deal Value added successfully'
            : 'Deal Value updated successfully',
        rowData: row,
         projectid: this.projectID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.fetchAllDealValues();
    });
  }
  fetchAllDealValues(): void {
    if (!this.projectID) return;

    this.http.post(`${this.baseUrl}/fetch_deal_value`, { project_id: this.projectID })
      .subscribe({
        next: (res: any) => {
          this.allProjectDealValues = res || [];
        },
        error: () => {
          this.snackBar.open('Unable to fetch deal values', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  fetchAllProjects(): void {
    this.loading = true;

    const payload = {
      user_id:  this.userId,
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.projectsList = res;
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  deleteBrokerageSlab(dealValueID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this Deal?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .post(`${this.baseUrl}/delete_deal_value`, {
            deal_value_id: dealValueID,
          })
          .subscribe({
            next: () => {
              this.snackBar.open('Deal deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllDealValues(); // refresh the data
            },
            error: () =>
              this.snackBar.open('Unable to delete the image.', 'Close', {
                duration: 3000,
              }),
          });
      }
    });
  }


}
