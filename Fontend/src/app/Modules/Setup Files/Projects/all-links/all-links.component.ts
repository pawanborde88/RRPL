import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { AddDocumentComponent } from '../add-document/add-document.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AddProjectLinksComponent } from '../add-project-links/add-project-links.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-all-links',
  standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      TemplateComponent,
      BreadcrumbComponent,
      AngularMaterialModule,
      FormsModule,
      ReactiveFormsModule,
      TruncatePipe, // Add the pipe here
    ],
  templateUrl: './all-links.component.html',
  styleUrl: './all-links.component.scss'
})
export class AllLinksComponent {
 @Input() projectID!: string;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  allProjectLinks: any[] = [];
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('Received Project ID:', this.projectID);
    if (this.projectID) {
      this.fetchAllProjectLinks();
    }
  }

  fetchAllProjectLinks(): void {
    this.http.post(`${this.baseUrl}/fetch_project_links`,{project_id:this.projectID}).subscribe({
      next: (res: any) => (this.allProjectLinks = res),
      error: () =>
        this.snackBar.open('Unable to fetch CP type.', 'Close', {
          duration: 3000,
        }),
    });
  }
  addProjectLink(action: string): void {
    if (action === 'add') {
      const dialogRef = this.dialog.open(AddProjectLinksComponent, {
        minWidth: '30vw',
        maxWidth: '50vh',
        maxHeight: '100vh',
        data: {
          title: 'Add Link',  // Fixed title for adding a link
          apiUrl: 'add_project_links',  // Only the add API URL
          successMessage: 'Link Added successfully',  // Success message for add action
          projectid: this.projectID,  // Pass the project ID
        },
      });
  
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.fetchAllProjectLinks(); // Refresh the list if data was modified
        }
      });
    }
  }
  deletelink(phaseID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete this Link?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .post(`${this.baseUrl}/delete_link`, {
            project_link_id: phaseID,
          })
          .subscribe({
            next: (data: any) => {
              this.fetchAllProjectLinks();

              this.snackBar.open(
                ` Link deleted successfully`,
                'Close',
                {
                  duration: 3000,
                }
              );
     
            },
            error: (err: any) => {
              console.error(err);
              this.snackBar.open('Unable to delete the image.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
  
}
