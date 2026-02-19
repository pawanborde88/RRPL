import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';




@Component({
  selector: 'app-leave-module',
  standalone: true,
  imports: [AngularMaterialModule, BreadcrumbComponent, TemplateComponent, RouterModule, CommonModule],
  templateUrl: './leave-module.component.html',
  styleUrl: './leave-module.component.scss'
})
export class LeaveModuleComponent {


  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }
  permissionData = sessionStorage.getItem('permission_id');
  loadingState: boolean = true;
  baseUrl = environment.API_URL;

  EnquiryData: any[] = [];
  ngOnInit(): void {

    this.fetchLeaveBalance();
  }

  LeaveData = [
    { label: 'Leave List', iconName: 'list_alt', route: '/leaves-list', disable: false, permission: 201 },
    { label: 'Holiday List', iconName: 'event', route: '/holiday-list', disable: false, permission: 201 },
    { label: 'Leave Credit View', iconName: 'credit_score', route: '/leave-credit-view', disable: false, permission: 201 },
  ];

  getLeaveBalanceIcon(label: string): string {
    const iconMap: { [key: string]: string } = {
      'Sick Leave': 'medical_services',
      'Earned Leave': 'stars',
      'Casual Leave': 'event_available',
      'Comp Off': 'restore_page',
    };
    return iconMap[label] || 'beach_access';
  }




  fetchLeaveBalance() {

    let obj = {
      account_id: sessionStorage.getItem('account_id'),
    };
    console.log(obj);

    this.http.post(`${this.baseUrl}/leave_balance`, obj).subscribe({
      next: (res: any) => {
        console.log(res);
        this.EnquiryData = res.data;
      },
      error: (err: any) => {
        console.log(err);
      },
      complete: () => { },
    });
  }


  onCardClick(event: Event, disable: boolean) {
    if (disable) {
      event.preventDefault();
    }
  }
  hasPermission(permission: any): boolean {
    return this.permissionData!.includes(permission);
  }

}
