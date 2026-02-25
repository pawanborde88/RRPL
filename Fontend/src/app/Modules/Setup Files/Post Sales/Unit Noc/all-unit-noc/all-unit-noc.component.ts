import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { ReciptBankMasterSComponent } from '../../Project Bank Master/Receipt Bank Master List/recipt-bank-master-s/recipt-bank-master-s.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../environments/environment';
import { AddUnitNocComponent } from '../add-unit-noc/add-unit-noc.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-all-unit-noc',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    ActionColumnComponent,

    ReciptBankMasterSComponent,

    AddUnitNocComponent,
    ReusableTableComponent

  ],
  templateUrl: './all-unit-noc.component.html',
  styleUrl: './all-unit-noc.component.scss'
})
export class AllUnitNocComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false;

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  ngOnInit(): void {
    this.fetchAllUnitNoc();
  }
  displayedColumns = [
    { key: 'actions', label: 'Actions', sticky: true, disabled: true },
    { key: 'project', label: 'Project' },
    { key: 'wing', label: 'Wing' },
    { key: 'Unit_no', label: 'Unit No.' },
    { key: 'Customer Name', label: ' Customer Name' },
    { key: 'mobile_no', label: 'Mobile No' },
    { key: 'email_id', label: 'Email ID' },
    { key: 'alternate_mob_no', label: 'Alternate Mobile No' },
    { key: 'whatsapp_no', label: 'WhatsApp No' },
    { key: 'bank_name', label: 'Bank Name' },
    { key: 'status', label: 'Status' },
    { key: 'agreement_amount', label: 'Agreement Amount' },
    { key: 'director_name', label: 'Director Name' },
    { key: 'director_sign_date', label: 'Director Sign Date' },
    { key: 'noc_holder_date', label: 'Noc Holder Date' },
    { key: 'remark', label: 'Remark' },
    { key: 'created_by', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At' },
  ];

  columnKeys: string[] = this.displayedColumns.map((col) => col.key);

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  fetchAllUnitNoc() {
    this.loading = true;

    const mockData = [
      {
        project: 'Skyline Heights',
        wing: 'A',
        Unit_no: '101',
        'Customer Name': 'John Doe',
        mobile_no: '9876543210',
        email_id: 'johndoe@example.com',
        alternate_mob_no: '9123456780',
        whatsapp_no: '9876543210',
        bank_name: 'HDFC Bank',
        status: 'Approved',
        agreement_amount: '75,00,000',
        director_name: 'Mr. Sharma',
        director_sign_date: '2023-10-01',
        noc_holder_date: '2023-10-05',
        remark: 'All docs submitted',
        created_by: 'Admin',
        updated_by: 'Manager',
        updated_at: '2024-02-15',
      },
      {
        project: 'Green Valley',
        wing: 'B',
        Unit_no: '202',
        'Customer Name': 'Jane Smith',
        mobile_no: '9988776655',
        email_id: 'jane@example.com',
        alternate_mob_no: '8877665544',
        whatsapp_no: '9988776655',
        bank_name: 'ICICI Bank',
        status: 'Pending',
        agreement_amount: '68,50,000',
        director_name: 'Ms. Kapoor',
        director_sign_date: '2023-11-12',
        noc_holder_date: '2023-11-15',
        remark: 'Waiting for sign',
        created_by: 'User1',
        updated_by: 'Team Lead',
        updated_at: '2024-03-22',
      },
      {
        project: 'Ocean View',
        wing: 'C',
        Unit_no: '303',
        'Customer Name': 'Rahul Mehta',
        mobile_no: '9090909090',
        email_id: 'rahul@example.com',
        alternate_mob_no: '8080808080',
        whatsapp_no: '9090909090',
        bank_name: 'SBI',
        status: 'Rejected',
        agreement_amount: '82,00,000',
        director_name: 'Mr. Verma',
        director_sign_date: '2023-09-20',
        noc_holder_date: '2023-09-25',
        remark: 'Bank issue',
        created_by: 'Admin',
        updated_by: 'Support Staff',
        updated_at: '2024-01-10',
      },
      {
        project: 'Skyline Heights',
        wing: 'A',
        Unit_no: '101',
        'Customer Name': 'John Doe',
        mobile_no: '9876543210',
        email_id: 'johndoe@example.com',
        alternate_mob_no: '9123456780',
        whatsapp_no: '9876543210',
        bank_name: 'HDFC Bank',
        status: 'Approved',
        agreement_amount: '75,00,000',
        director_name: 'Mr. Sharma',
        director_sign_date: '2023-10-01',
        noc_holder_date: '2023-10-05',
        remark: 'All docs submitted',
        created_by: 'Admin',
        updated_by: 'Manager',
        updated_at: '2024-02-15',
      },
      {
        project: 'Green Valley',
        wing: 'B',
        Unit_no: '202',
        'Customer Name': 'Jane Smith',
        mobile_no: '9988776655',
        email_id: 'jane@example.com',
        alternate_mob_no: '8877665544',
        whatsapp_no: '9988776655',
        bank_name: 'ICICI Bank',
        status: 'Pending',
        agreement_amount: '68,50,000',
        director_name: 'Ms. Kapoor',
        director_sign_date: '2023-11-12',
        noc_holder_date: '2023-11-15',
        remark: 'Waiting for sign',
        created_by: 'User1',
        updated_by: 'Team Lead',
        updated_at: '2024-03-22',
      },
      {
        project: 'Ocean View',
        wing: 'C',
        Unit_no: '303',
        'Customer Name': 'Rahul Mehta',
        mobile_no: '9090909090',
        email_id: 'rahul@example.com',
        alternate_mob_no: '8080808080',
        whatsapp_no: '9090909090',
        bank_name: 'SBI',
        status: 'Rejected',
        agreement_amount: '82,00,000',
        director_name: 'Mr. Verma',
        director_sign_date: '2023-09-20',
        noc_holder_date: '2023-09-25',
        remark: 'Bank issue',
        created_by: 'Admin',
        updated_by: 'Support Staff',
        updated_at: '2024-01-10',
      },
      {
        project: 'Skyline Heights',
        wing: 'A',
        Unit_no: '101',
        'Customer Name': 'John Doe',
        mobile_no: '9876543210',
        email_id: 'johndoe@example.com',
        alternate_mob_no: '9123456780',
        whatsapp_no: '9876543210',
        bank_name: 'HDFC Bank',
        status: 'Approved',
        agreement_amount: '75,00,000',
        director_name: 'Mr. Sharma',
        director_sign_date: '2023-10-01',
        noc_holder_date: '2023-10-05',
        remark: 'All docs submitted',
        created_by: 'Admin',
        updated_by: 'Manager',
        updated_at: '2024-02-15',
      },
      {
        project: 'Green Valley',
        wing: 'B',
        Unit_no: '202',
        'Customer Name': 'Jane Smith',
        mobile_no: '9988776655',
        email_id: 'jane@example.com',
        alternate_mob_no: '8877665544',
        whatsapp_no: '9988776655',
        bank_name: 'ICICI Bank',
        status: 'Pending',
        agreement_amount: '68,50,000',
        director_name: 'Ms. Kapoor',
        director_sign_date: '2023-11-12',
        noc_holder_date: '2023-11-15',
        remark: 'Waiting for sign',
        created_by: 'User1',
        updated_by: 'Team Lead',
        updated_at: '2024-03-22',
      },
      {
        project: 'Ocean View',
        wing: 'C',
        Unit_no: '303',
        'Customer Name': 'Rahul Mehta',
        mobile_no: '9090909090',
        email_id: 'rahul@example.com',
        alternate_mob_no: '8080808080',
        whatsapp_no: '9090909090',
        bank_name: 'SBI',
        status: 'Rejected',
        agreement_amount: '82,00,000',
        director_name: 'Mr. Verma',
        director_sign_date: '2023-09-20',
        noc_holder_date: '2023-09-25',
        remark: 'Bank issue',
        created_by: 'Admin',
        updated_by: 'Support Staff',
        updated_at: '2024-01-10',
      }
    ];

    this.dataSource.data = mockData;
    this.loading = false;

    // Attach paginator and sort after setting data
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  handleTableAction(event: { row: any; action: string }) {
    if (event.action === 'delete') {
      this.deleteProject(event.row);
    }
  }
  deleteProject(Id: any) { }
}
