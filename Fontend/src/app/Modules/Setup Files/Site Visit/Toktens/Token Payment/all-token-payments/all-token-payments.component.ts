import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { environment } from '../../../../../../../environments/environment';
import { ReusableTableComponent } from '../../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TruncatePipe } from '../../../../../../Pipes/truncate.pipe';
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-all-token-payments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReusableTableComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    TemplateComponent,
    BreadcrumbComponent
  ],
  templateUrl: './all-token-payments.component.html',
  styleUrl: './all-token-payments.component.scss'
})
export class AllTokenPaymentsComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  storageUrl = environment.STORAGE_URL;
  selectedUsers: any[] = [];
  selectedUserId: number | null = null; // Track the selected user ID
  tokenID: any;

  loading = false;
  baseUrl = environment.API_URL;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient, private _activatedRoute: ActivatedRoute, private dialog: MatDialog,
    private snackBar: MatSnackBar) { }

  ngOnInit(): void {
    this._activatedRoute.paramMap.subscribe((params) => {
      this.tokenID = params.get('token_id');
    });

    this.fetchallTokenPaymets();
  }

  displayedColumns = [
    {
      key: 'sr_no',
      label: 'Sr. No',
      type: 'index',
    },
    {
      key: 'payment_mode',
      label: 'Payment Mode',
    },
    // {
    //   key: 'date',
    //   label: 'Date',
    //   type: 'date',
    // },
    {
      key: 'amount',
      label: 'Amount',
      type: 'currency', // Optional: for formatting
    },
    {
      key: 'payment_attachment',
      label: 'Attachment',
      type: 'file', // Assuming it's a file or image
    },
    {
      key: 'cheque_no',
      label: 'Cheque No.',
    },
    {
      key: 'transaction_id',
      label: 'Transaction ID',
    },
    {
      key: 'card_no',
      label: 'Card No.',
    },
    {
      key: 'bank_name',
      label: 'Bank Name',
    },
    {
      key: 'bank_branch',
      label: 'Bank Branch',
    },
    {
      key: 'ifsc_code',
      label: 'IFSC Code',
    },
    {
      key: 'created_at',
      label: 'Created At',
      type: 'date',
    },
    {
      key: 'updated_by',
      label: 'Updated By',
    },
    {
      key: 'created_by_name',
      label: 'Created By',
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      type: 'date',
    }
  ];

  columnKeys: string[] = this.displayedColumns.map((col) => col.key);

  applyFilter(searchText: string) {
    this.dataSource.filter = searchText.trim().toLowerCase();
  }

  fetchallTokenPaymets(): void {
    this.loading = true;
    this.http.post(`${this.baseUrl}/fetch_token_payment`, { token_id: this.tokenID }).subscribe({
      next: (res: any) => {
        this.dataSource.data = res;
        this.dataSource = new MatTableDataSource(res);

        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch project leads.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
