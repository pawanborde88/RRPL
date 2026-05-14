import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';

@Component({
  selector: 'app-salesreport',
  standalone: true,
   imports: [
     CommonModule,
     RouterModule,
     TemplateComponent,
     BreadcrumbComponent,
     AngularMaterialModule,
     FormsModule,
     ReactiveFormsModule,
     
   ],
  templateUrl: './salesreport.component.html',
  styleUrl: './salesreport.component.scss'
})
export class SalesreportComponent {
  loadingState: boolean = true;
  baseUrl = environment.API_URL;
  permissionData: string | null = sessionStorage.getItem('permission_id');
  
  // Define your section with dashboard items
  section = {
    items: [
      // Add your dashboard items here
      { routerLink: '', icon: 'analytics', label: '', disabled: false },



      // Add more items as needed
    ].filter(item => !item.disabled) // Optional: filter out disabled items
  };

  constructor(private router: Router) {}

  hasPermission(permission: string): boolean {
    return this.permissionData
      ? this.permissionData.includes(permission)
      : false;
  }

  onCardClick(event: Event, routerLink: string | any[] | null | undefined) {
    event.preventDefault();
    if (routerLink) {
      this.router.navigate(Array.isArray(routerLink) ? routerLink : [routerLink]);
    }
  }
}
