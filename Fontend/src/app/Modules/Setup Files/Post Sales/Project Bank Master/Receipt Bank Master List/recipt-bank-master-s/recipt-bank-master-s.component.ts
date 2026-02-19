import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../../Common/action-column/action-column.component';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';

import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../../Pipes/truncate.pipe';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../../environments/environment';
import { ReusableTableComponent } from '../../../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-recipt-bank-master-s',
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
    ReusableTableComponent

  ],
  templateUrl: './recipt-bank-master-s.component.html',
  styleUrl: './recipt-bank-master-s.component.scss'
})
export class ReciptBankMasterSComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false;

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  ngOnInit(): void {
    this.fetchBankRecipent();
  }
  displayedColumns = [
    { key: 'actions', label: 'Actions', sticky: true, disabled: true },
    { key: 'master_name', label: 'Master Name' },
    { key: 'value', label: 'Value' },
    { key: 'display_order', label: 'Display Order' },
    { key: 'status', label: 'Status' },
    { key: 'created_by', label: 'Created By' },
    { key: 'created_on', label: 'Created On' },
  ];
  
  columnKeys: string[] = this.displayedColumns.map((col) => col.key);
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  fetchBankRecipent() {
    this.loading = true;

    // Dummy static data for now (replace with API call)
    const mockData = [
      {
        master_name: 'Bank Master',
        value: 'Canara Bank',
        display_order: 0,
        status: 'Active',
        created_by: 'DEFAULT .',
        created_on: '10-Jan-2023 11:20:52 AM',
      },
      {
        master_name: 'Receipt Bank Master',
        value: 'BANDHAN BANK LIMITED',
        display_order: 8,
        status: 'Active',
        created_by: 'DEFAULT .',
        created_on: '25-Mar-2024 11:17:02 AM',
      },
      {
        master_name: 'Bank Master',
        value: 'Aavas Financiers limited',
        display_order: 0,
        status: 'Active',
        created_by: 'REENA AHIRE',
        created_on: '23-Jul-2024 12:28:31 PM',
      },
      {
        master_name: 'Bank Master',
        value: 'BOB',
        display_order: 0,
        status: 'InActive',
        created_by: 'MADHUSUDAN JADHAV',
        created_on: '14-Sep-2022 12:57:49 PM',
      },
      // Add more rows as needed...
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
  deleteProject(Id: any) {}
}
