import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-lmsdashboard',
  standalone: true,
  imports: [
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    RouterModule,
    AngularMaterialModule,
    FormsModule
  ],
  templateUrl: './lmsdashboard.component.html',
  styleUrl: './lmsdashboard.component.scss'
})
export class LMSDashboardComponent implements OnInit {
  baseUrl = environment.API_URL;
  loading: boolean = false;

  dashboardData: any;
  usersData: any;
  lectureData: any;

  topCoursesChart: any;
  roleEnrollmentChart: any;
  topLecturesChart: any;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.fetchLMSCourseCount();
    this.fetchLMSDashboardCount();
    this.fetchLMSLectureCount();
  }

  fetchLMSCourseCount(): void {
    // This seems to correspond to the first JSON in user request: lms_dashboard_count
    this.http.post(`${this.baseUrl}/lms_dashboard_count`, {}).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.dashboardData = res.data;
        }
      },
      error: (err: any) => {
        console.error(err);
      },
    });
  }

  fetchLMSDashboardCount(): void {
    // This seems to correspond to the second JSON in user request: lms_users_count
    this.http.post(`${this.baseUrl}/lms_users_count`, {}).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.usersData = res.data;
          this.renderUserCharts();
        }
      },
      error: (err: any) => {
        console.error(err);
      },
    });
  }

  fetchLMSLectureCount(): void {
    // This seems to correspond to the third JSON in user request: lms_lecture_count
    this.http.post(`${this.baseUrl}/lms_lecture_count`, {}).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.lectureData = res.data;
          this.renderLectureApps();
        }
      },
      error: (err: any) => {
        console.error(err);
      },
    });
  }

  renderUserCharts() {
    if (this.usersData) {
      this.renderTopCoursesChart();
      this.renderRoleEnrollmentChart();
    }
  }

  renderLectureApps() {
    if (this.lectureData) {
      this.renderTopLecturesChart();
    }
  }

  renderTopCoursesChart() {
    const ctx = document.getElementById('topCoursesChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.topCoursesChart) this.topCoursesChart.destroy();

    const labels = this.usersData.top_4_enrolled_courses.map((c: any) => c.course_title);
    const data = this.usersData.top_4_enrolled_courses.map((c: any) => c.enroll_count);

    this.topCoursesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#F59E0B', // Yellow
            '#10B981', // Green
            '#3B82F6', // Blue
            '#8B5CF6'  // Purple
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              font: { family: "'Inter', sans-serif", size: 11 }
            }
          },
          title: { display: false }
        },
        cutout: '75%',
      }
    });
  }

  renderRoleEnrollmentChart() {
    const ctx = document.getElementById('roleEnrollmentChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.roleEnrollmentChart) this.roleEnrollmentChart.destroy();

    // Filter out roles with 0 users to make the chart cleaner
    const activeRoles = this.usersData.role_wise_enrollment.filter((r: any) => r.enrolled_users > 0);
    const labels = activeRoles.map((r: any) => r.role_name);
    const data = activeRoles.map((r: any) => r.enrolled_users);

    this.roleEnrollmentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Enrolled Users',
          data: data,
          backgroundColor: '#4F46E5', // Indigo-600
          borderRadius: 4,
          maxBarThickness: 32, // Limit bar width
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#F3F4F6', // Gray-100
              tickLength: 0,
              drawBorder: false
            },
            ticks: {
              font: { family: "'Inter', sans-serif", size: 10 },
              color: '#9CA3AF'
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              font: { family: "'Inter', sans-serif", size: 10 },
              color: '#9CA3AF',
              autoSkip: false,
              maxRotation: 45,
              minRotation: 0
            }
          }
        }
      }
    });
  }

  renderTopLecturesChart() {
    const ctx = document.getElementById('topLecturesChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.topLecturesChart) this.topLecturesChart.destroy();

    const labels = this.lectureData.top_5_lectures.map((l: any) => l.lecture_title);
    const data = this.lectureData.top_5_lectures.map((l: any) => l.enroll_count);

    this.topLecturesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Views',
          data: data,
          backgroundColor: '#EC4899', // Pink-500
          borderRadius: 4,
          maxBarThickness: 40,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#F3F4F6',
              tickLength: 0,
              drawBorder: false
            },
            ticks: {
              font: { family: "'Inter', sans-serif", size: 10 },
              color: '#9CA3AF'
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              font: { family: "'Inter', sans-serif", size: 10 },
              color: '#9CA3AF'
            }
          }
        }
      }
    });
  }
}
