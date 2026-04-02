import { Component, ViewChild } from '@angular/core';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AddLecturesComponent } from '../add-lectures/add-lectures.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-all-lectures',
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
  templateUrl: './all-lectures.component.html',
  styleUrl: './all-lectures.component.scss',
})
export class AllLecturesComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state

  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  sectionID: string | null = null;
  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private fetch: FetchFunctionsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.sectionID = params['section_id'];
    });
    if (this.sectionID) {
      this.fetchAllLectures();
    }
  }

  fetchAllLectures(): void {
    this.loading = true;
    this.http
      .post(`${this.baseUrl}/fetch_lectures`, {
        section_id: this.sectionID,
        logged_user_id: this.userId,
      })
      .subscribe({
        next: (res: any) => {
          this.dataSource.data = res;
          this.loading = false;
        },
        error: (err: any) => {
          console.error(err);
          this.loading = false;
          this.snackBar.open('Unable to fetch channel partners.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  openLecturesDialog(action: string, element: any): void {
    console.log('Element Data:', element);
    const dialogRef = this.dialog.open(AddLecturesComponent, {
      minWidth: '70vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Lectures' : 'Edit Lectures',
        apiUrl: action === 'add' ? 'add_lectures' : 'edit_lecture',
        successMessage:
          action === 'add'
            ? 'Lectures added successfully'
            : 'Lectures updated successfully',
        rowData: element,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllLectures(); // Refresh the list if data was modified
      }
    });
  }
  deleteLecture(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Lecture?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          lecture_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_lecture`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Lecture deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllLectures(); // Ensure this is called here to update the teams
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete Lecture.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
