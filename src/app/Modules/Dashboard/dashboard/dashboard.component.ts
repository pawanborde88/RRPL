import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { RouterModule, RouterOutlet } from '@angular/router';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [AngularMaterialModule, BreadcrumbComponent, TemplateComponent, RouterModule, CommonModule],
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);

  readonly loadingState = signal(true);
  readonly baseUrl = environment.API_URL;

  readonly enquiryData = signal([
    { label: 'Enquiries', iconUrl: 'assets/svg/compare_arrows_24dp_FILL0_wght400_GRAD0_opsz24.svg', route: 'enquiries', icon: 'delete', disable: false },
    { label: 'Loan Applications', iconUrl: 'assets/svg/person-public-svgrepo-com.svg', route: 'customer', icon: 'delete', disable: false },
    { label: 'Partners', iconUrl: 'assets/svg/partner_exchange_24dp_FILL0_wght400_GRAD0_opsz24.svg', route: 'crm/partners', icon: 'delete', disable: false },
    { label: 'HRMS', iconUrl: 'assets/svg/laptop_chromebook_24dp_FILL0_wght400_GRAD0_opsz24.svg', route: 'customer', icon: 'delete', disable: true },
  ]);

  onCardClick(event: Event, disable: boolean): void {
    if (disable) {
      event.preventDefault();
    }
  }
}
// this.snackBar.open('Loading...', undefined, { duration: undefined });

// // let obj = {
// //   account_id: sessionStorage.getItem('account_id'), user_id: sessionStorage.getItem('session_id'),
// //   role_id: sessionStorage.getItem('role_id'),
// // };
// this.http.post(`${this.baseUrl}/dashboard`, obj)
//   .subscribe({
//     next: (res: any) => {
//       if(res.success){
//         console.log(res)
//         this.EnquiryData =res.data;
//       }

//     },
//     error: (err: any) => {
//       console.log(err);
//       this.snackBar.open('Error, unable to fetch data');
//     },
//     complete: () => {
//       this.loadingState = false;
//       this.snackBar.dismiss();
//     }
//   })
// }
