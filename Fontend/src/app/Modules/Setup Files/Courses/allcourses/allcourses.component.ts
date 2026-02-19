import { Component, inject, ViewChild } from '@angular/core';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { AddCourseComponent } from '../add-course/add-course.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AuthService } from '../../../../Service/auth.service';

@Component({
  selector: 'app-allcourses',
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
  templateUrl: './allcourses.component.html',
  styleUrl: './allcourses.component.scss',
})
export class AllcoursesComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state

  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();
  private readonly authService = inject(AuthService);
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  storageUrl = environment.STORAGE_URL;
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,
    private fetch: FetchFunctionsService
  ) { }

  displayedColumns: string[] = [
    'title',
    'quiz_name',
    'thumbnail_img',
    'created_by_name',
    'created_at',
    'updated_by_name',
    'updated_at',
    'actions',
  ];

  ngOnInit(): void {
    this.fetchAllCourses();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  fetchAllCourses(): void {
    this.loading = true;
    this.http.post(`${this.baseUrl}/fetch_all_courses`, { user_id: this.userId }).subscribe({
      next: (res: any) => {
        // Handle the new response structure with inprogress_courses, locked_courses, and completed_courses
        const allCourses: any[] = [];

        // Add in-progress courses with status
        if (res.inprogress_courses) {
          res.inprogress_courses.forEach((course: any) => {
            allCourses.push({
              ...course,
              course_status: 'in_progress',
              created_by_name: course.created_by_string || 'N/A',
              updated_by_name: course.updated_by_string || 'N/A',
              enroll_exists: true,
              enroll_count: 0
            });
          });
        }

        // Add locked courses with status
        if (res.locked_courses) {
          res.locked_courses.forEach((course: any) => {
            allCourses.push({
              ...course,
              course_status: 'locked',
              created_by_name: course.created_by_string || 'N/A',
              updated_by_name: course.updated_by_string || 'N/A',
              enroll_exists: false,
              enroll_count: 0
            });
          });
        }

        // Add completed courses with status
        if (res.completed_courses) {
          res.completed_courses.forEach((course: any) => {
            allCourses.push({
              ...course,
              course_status: 'completed',
              created_by_name: course.created_by_string || 'N/A',
              updated_by_name: course.updated_by_string || 'N/A',
              enroll_exists: true,
              enroll_count: 0
            });
          });
        }

        this.dataSource.data = allCourses;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch Courses.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  openCourseDialog(action: string, element?: any): void {
    console.log('Element Data:', element);
    const dialogRef = this.dialog.open(AddCourseComponent, {
      minWidth: '70vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title:
          action === 'add' ? 'Add Course' : 'Edit Course',
        apiUrl:
          action === 'add' ? 'add_course' : 'edit_course',
        successMessage:
          action === 'add'
            ? 'Course added successfully'
            : 'Course updated successfully',
        rowData: element, // Pass row data if editing
      },


    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllCourses(); // Refresh the list if data was modified
      }
    });

  }
  readonly hasPermission = (permission: string): boolean =>
    this.authService.hasPermission(permission);

  readonly hasOnlyRoles = (allowedRoles: number[]): boolean =>
    this.authService.hasOnlyRoles(allowedRoles);
  deleteCourse(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Course?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          course_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_course`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Course deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllCourses(); // Ensure this is called here to update the teams
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

  enrollCourse(course: any): void {
    const requestPayload = {
      user_id: this.userId,
      course_id: course.course_id,
      start_date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    };

    this.http
      .post(`${this.baseUrl}/enroll_course`, requestPayload)
      .subscribe({
        next: (data: any) => {
          this.snackBar.open('Successfully enrolled in the course!', 'Close', {
            duration: 3000,
          });
          // Navigate to sections page after successful enrollment
          this.router.navigate(['/setup/sections', course.course_slug, course.course_id]);
        },
        error: (err: any) => {
          console.error(err);
          this.snackBar.open(
            err.error?.message || 'Unable to enroll in the course. Please try again.',
            'Close',
            {
              duration: 3000,
            }
          );
        },
      });
  }
}
