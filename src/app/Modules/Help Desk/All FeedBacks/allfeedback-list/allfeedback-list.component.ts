import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { AddFaceBookComponent } from '../../../Facebook/Facebook Setup/add-face-book/add-face-book.component';
import { AddFeedBakDialogComponent } from '../../Add Feedback/add-feed-bak-dialog/add-feed-bak-dialog.component';
import { PreviewImagesComponent } from '../../../Setup Files/Projects/preview-images/preview-images.component';

@Component({
  selector: 'app-allfeedback-list',
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

    ReusableTableComponent,
  ],
  templateUrl: './allfeedback-list.component.html',
  styleUrl: './allfeedback-list.component.scss'
})
export class AllfeedbackListComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allFeedbackList: any[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<any>();
  @ViewChild(MatSort) sort!: MatSort;
  searchText: string = '';
  pipe = new DatePipe('en-US');
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private fetch: FetchFunctionsService
  ) {}


  ngOnInit(): void {
    this.fetchAllFeedbackList();
  }



  fetchAllFeedbackList(): void {
    this.loading = true;

    this.http.get(`${this.baseUrl}/fetch_all_feedback`).subscribe({
      next: (res: any) => {
        this.allFeedbackList = res;

        // this.dataSource.data = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch bookings.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  openaddFacebookDialog(): void {
    const dialogRef = this.dialog.open(AddFeedBakDialogComponent, {
      width: '600px',
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllFeedbackList();
      }
    });
  }
  previewImages(imageData: any): void {
    const dialogRef = this.dialog.open(PreviewImagesComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        images: imageData,
        name: 'project_image'
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle any actions after the dialog closes if needed
      }
    });
  }

  deleteFaceBookID(projectEnquiryID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Facebook?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const reason = result.reason; // Get the reason from the dialog response

        let requestPayload = {
          facebook_setup_id: projectEnquiryID,
          reason: reason, // Set the reason from the dialog
          created_by: this.userId, // Set created_by value here
        };

        this.http
          .post(`${this.baseUrl}/delete_facebook_setup`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Facebook deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllFeedbackList(); // Ensure this is called here to update the teams
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

  get filteredFeedbackList(): any[] {
    if (!this.searchText) {
      return this.allFeedbackList;
    }
    const term = this.searchText.toLowerCase();
    return this.allFeedbackList.filter(fb =>
      (fb.description && fb.description.toLowerCase().includes(term)) ||
      (fb.feedback_category && fb.feedback_category.toLowerCase().includes(term)) ||
      (fb.project_name && fb.project_name.toLowerCase().includes(term)) ||
      (fb.user_name && fb.user_name.toLowerCase().includes(term))
    );
  }


}
