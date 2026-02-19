import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { ProjectSpecificationComponent } from '../project-specification/project-specification.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { PreviewImagesComponent } from '../preview-images/preview-images.component';

@Component({
  selector: 'app-all-specifications',
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
  templateUrl: './all-specifications.component.html',
  styleUrl: './all-specifications.component.scss',
})
export class AllSpecificationsComponent implements OnInit {
  @Input() projectID!: string;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  projectData: any = {};
  roleId = Number(sessionStorage.getItem('role_id')) || null;
  userId = Number(sessionStorage.getItem('session_id')) || null;
  allConfiguration: any[] = [];
  allProjectSpecifiationList: any[] = [];
  selectedVariant: string = '';

  ngOnInit(): void {
    this.fetchAllProjectSpecificaion();
  }
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
    private route: ActivatedRoute
  ) {}
  fetchAllProjectSpecificaion(): void {
    this.http
      .post(`${this.baseUrl}/fetch_project_specification`, {
        project_id: this.projectID,
      })
      .subscribe({
        next: (res: any) => {
          this.allProjectSpecifiationList = res;
        },
        error: () => {
          this.snackBar.open(
            'Unable to fetch project configuration.',
            'Close',
            {
              duration: 3000,
            }
          );
        },
      });
  }
  previewImages(imageData: any): void {
    const dialogRef = this.dialog.open(PreviewImagesComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        images: imageData,
        name: 'specification_icon'
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Handle any actions after the dialog closes if needed
      }
    });
  }
  openSpecificationDialog(action: string, row?: any): void {
    const dialogRef = this.dialog.open(ProjectSpecificationComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Specification' : 'Edit Specification',
        apiUrl:
          action === 'add'
            ? 'add_project_specification'
            : 'edit_project_specification',
        successMessage:
          action === 'add'
            ? 'Specification added successfully'
            : 'Specification updated successfully',
        rowData: row,
        projectid: this.projectID,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      this.fetchAllProjectSpecificaion();
    });
  }
}
