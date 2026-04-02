import { CommonModule } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as echarts from 'echarts';

interface CourseData {
  course_title: string;
  enroll_count: number;
}

interface RoleData {
  role_name: string;
  enrolled_users: number;
}

interface LectureData {
  lecture_title: string;
  enroll_count: number;
}

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
  @ViewChild('topCoursesChart') topCoursesRef!: ElementRef;
  @ViewChild('roleEnrollmentChart') roleEnrollmentRef!: ElementRef;
  @ViewChild('topLecturesChart') topLecturesRef!: ElementRef;

  private topCoursesChartInst?: echarts.ECharts;
  private roleEnrollmentChartInst?: echarts.ECharts;
  private topLecturesChartInst?: echarts.ECharts;

  baseUrl = environment.API_URL;
  loading: boolean = false;

  dashboardData: any;
  usersData: any;
  lectureData: any;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.fetchLMSCourseCount();
    this.fetchLMSDashboardCount();
    this.fetchLMSLectureCount();

    window.addEventListener('resize', () => {
      this.topCoursesChartInst?.resize();
      this.roleEnrollmentChartInst?.resize();
      this.topLecturesChartInst?.resize();
    });
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
      setTimeout(() => {
        this.renderTopCoursesChart();
        this.renderRoleEnrollmentChart();
      }, 300);
    }
  }

  renderLectureApps() {
    if (this.lectureData) {
      setTimeout(() => {
        this.renderTopLecturesChart();
      }, 300);
    }
  }

  private renderTopCoursesChart() {
    if (!this.topCoursesRef?.nativeElement) return;
    if (!this.topCoursesChartInst) {
      this.topCoursesChartInst = echarts.init(this.topCoursesRef.nativeElement);
    }

    const courses: CourseData[] = this.usersData.top_4_enrolled_courses || [];
    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { 
        orient: 'vertical', 
        right: '5%', 
        top: 'center', 
        textStyle: { fontSize: 10, color: '#64748b' }, 
        icon: 'circle',
        itemGap: 8
      },
      series: [{
        name: 'Enrollments',
        type: 'pie',
        radius: ['60%', '90%'],
        center: ['30%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: false } },
        labelLine: { show: false },
        data: courses.map(c => ({ value: c.enroll_count, name: c.course_title }))
      }],
      color: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
    };
    this.topCoursesChartInst.setOption(option);
  }

  private renderRoleEnrollmentChart() {
    if (!this.roleEnrollmentRef?.nativeElement) return;
    if (!this.roleEnrollmentChartInst) {
      this.roleEnrollmentChartInst = echarts.init(this.roleEnrollmentRef.nativeElement);
    }

    const activeRoles: RoleData[] = (this.usersData.role_wise_enrollment || []).filter((r: any) => r.enrolled_users > 0);
    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '2%', right: '2%', bottom: '5%', top: '5%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: activeRoles.map(r => r.role_name), 
        axisLabel: { color: '#94a3b8', fontSize: 10, interval: 0, rotate: 30 }, 
        axisLine: { show: false }, 
        axisTick: { show: false } 
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { color: '#94a3b8', fontSize: 10 }, 
        axisLine: { show: false }, 
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } } 
      },
      series: [{
        data: activeRoles.map(r => r.enrolled_users),
        type: 'bar',
        barWidth: '60%',
        itemStyle: { 
          borderRadius: [6, 6, 0, 0], 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#4f46e5' }]) 
        }
      }]
    };
    this.roleEnrollmentChartInst.setOption(option);
  }

  private renderTopLecturesChart() {
    if (!this.topLecturesRef?.nativeElement) return;
    if (!this.topLecturesChartInst) {
      this.topLecturesChartInst = echarts.init(this.topLecturesRef.nativeElement);
    }

    const lectures: LectureData[] = this.lectureData.top_5_lectures || [];
    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '2%', right: '2%', bottom: '8%', top: '10%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: lectures.map(l => l.lecture_title), 
        axisLabel: { interval: 0, fontSize: 10, color: '#94a3b8', width: 80, overflow: 'break' }, 
        axisLine: { show: false }, 
        axisTick: { show: false } 
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { fontSize: 10, color: '#94a3b8' }, 
        axisLine: { show: false }, 
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } } 
      },
      series: [{
        data: lectures.map(l => l.enroll_count),
        type: 'bar',
        barWidth: '50%',
        itemStyle: { 
          borderRadius: [8, 8, 0, 0], 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#ec4899' }, { offset: 1, color: '#be185d' }]) 
        }
      }]
    };
    this.topLecturesChartInst.setOption(option);
  }
}
