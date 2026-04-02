import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ReusableTableComponent } from '../../../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-cp-bill-approved-log',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule, ReusableTableComponent],
  templateUrl: './cp-bill-approved-log.component.html',
  styleUrl: './cp-bill-approved-log.component.scss'
})
export class CpBillApprovedLogComponent implements OnInit {
  baseUrl = environment.API_URL;
  approvalLogs: any[] = [];
  loading = false;
  bookingBillId: number = 0;
  
  // Table configuration
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns = [
    {
      key: 'sr_no',
      label: 'Sr. No',
      type: 'index',
    },
    {
      key: 'approval_level_name',
      label: 'Approval Level',
    },
    {
      key: 'approval_status_text',
      label: 'Status',
    },
    {
      key: 'remark',
      label: 'Remark',
    },
    {
      key: 'created_by_name',
      label: 'Approved By',
    },
    {
      key: 'created_at',
      label: 'Approved Date',
      type: 'date',
    },
  ];
  
  constructor(
    public dialogRef: MatDialogRef<CpBillApprovedLogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    if (data?.editData?.booking_bill_id) {
      this.bookingBillId = data.editData.booking_bill_id;
    }
  }

  ngOnInit(): void {
    if (this.bookingBillId) {
      this.fetchApprovalLogs();
    }
  }

  fetchApprovalLogs(): void {
    this.loading = true;
    const payload = {
      booking_bill_id: this.bookingBillId
    };

    this.http
      .post<{ data: any[] }>(`${this.baseUrl}/fetch_bill_approval_logs`, payload)
      .subscribe({
        next: (res) => {
          this.approvalLogs = res.data || [];
          this.dataSource.data = this.approvalLogs;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.snackBar.open('Unable to fetch approval logs.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
