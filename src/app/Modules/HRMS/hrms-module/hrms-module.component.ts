import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { RouterModule, RouterOutlet } from '@angular/router';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { CommonModule } from '@angular/common';






@Component({
  selector: 'app-hrms-module',
  standalone: true,
  imports: [AngularMaterialModule, BreadcrumbComponent, TemplateComponent, RouterModule, CommonModule],
  templateUrl: './hrms-module.component.html',
  styleUrl: './hrms-module.component.scss'
})
export class HrmsModuleComponent {

  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

  loadingState: boolean = true;

  baseUrl = environment.API_URL;

  EnquiryData = [
    { label: 'Employees', icon: 'people', color: '#2196F3', route: '/employee-list', disable: false, permission: 197 },
    { label: 'Attendance', icon: 'assignment_ind', color: '#4CAF50', route: '/attendance-list', disable: false, permission: 198 },
    { label: 'Leave Module', icon: 'event_available', color: '#FF9800', route: '/leaves-module', disable: false, permission: 1 },
    { label: 'Performance', icon: 'trending_up', color: '#673AB7', route: '/performance-list', disable: false, permission: 200 },
  ];


  onCardClick(event: Event, disable: boolean) {
    if (disable) {
      event.preventDefault();
    }
  }
  permissionData = sessionStorage.getItem('permission_id');
  ngOnInit(): void {
  }

  hasPermission(permission: any): boolean {
    return this.permissionData!.includes(permission);
  }

}
