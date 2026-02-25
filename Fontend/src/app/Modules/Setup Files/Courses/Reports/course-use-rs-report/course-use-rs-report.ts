import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';

@Component({
  selector: 'app-course-use-rs-report',
  imports: [
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ConfigurableAgGridDataComponent
  ],
  templateUrl: './course-use-rs-report.html',
  styleUrl: './course-use-rs-report.scss',
})
export class CourseUseRsReport {
  baseUrl = environment.API_URL;
  loading = signal(false);
  selectedCourseId = signal<any>(null);

  bookingDisplayedColumns: any[] = [
    { key: 'course_title', label: 'Course' },
    { key: 'full_name', label: 'Name' },
    { key: 'role_names', label: 'Role' },
    { key: 'user_email', label: 'Email', type: 'sensitive' },
    { key: 'user_phone', label: 'Phone', type: 'sensitive' },
  ];

  dashboardData: any;
  usersData: any;
  lectureData: any;
  allCourses: any[] = [];

  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;

  topCoursesChart: any;
  roleEnrollmentChart: any;
  topLecturesChart: any;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
  }

  ngOnInit(): void {
    this.fetchAllCourses();

  }

  fetchAllCourses(): void {
    this.http.get(`${this.baseUrl}/all_course_dropdown`).subscribe({
      next: (res: any) => {
        this.allCourses = res || [];
      },
      error: (err) => console.error('Failed to load courses', err)
    });
  }
  readonly getAgGridApiPayload = computed(() => {
    const filters: any = {};

    if (this.selectedCourseId()) {
      filters.course_id = this.selectedCourseId();
    }

    return { filters };
  });

  onCourseChange(): void {
    if (this.selectedCourseId() && this.agGridTable) {
      setTimeout(() => {
        this.agGridTable.refreshData();
      });
    }
  }

}
