import { Component, OnInit } from '@angular/core';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { SopPreviewComponent } from '../sop-preview/sop-preview.component';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';

@Component({
  selector: 'app-sop-execution-histroy',
  standalone: true,
 imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    AngularMaterialModule,
    BreadcrumbComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './sop-execution-histroy.component.html',
  styleUrl: './sop-execution-histroy.component.scss'
})
export class SopExecutionHistroyComponent implements OnInit{
  sopDetailId: string | null = null;
    baseUrl = environment.API_URL;
    domainUrl = environment.domainUrl;
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      console.log(params);

      this.sopDetailId = params['data'];
      console.log('SOP Detail ID:', this.sopDetailId);

      this.fetchSopData(); // Call the combined method to fetch data based on sopDetailId
    });
  }
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['sop_title', 'purpose', 'status','created_by_name', 'created_at', 'updated_at', 'actions'];


  fetchSopData(): void {
    const userId = sessionStorage.getItem('session_id'); // Defaulting to user_id 118 if session_id is unavailable
    const requestPayload = this.sopDetailId
      ? { user_id: userId, sop_detail_id: this.sopDetailId }
      : { user_id: userId };

    const apiEndpoint = this.sopDetailId ? '/fetch_single_sop_history' : '/fetch_sop_execution';

    this.http.post(`${this.baseUrl}${apiEndpoint}`, requestPayload).subscribe({
      next: (res: any) => {
        this.dataSource.data = res || [];
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open(
          this.sopDetailId ? 'Unable to fetch SOP history details.' : 'Unable to fetch SOP details.',
          'Close',
          {
            duration: 3000,
          }
        );
      },
    });
  }

}
