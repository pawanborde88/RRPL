import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-import-leadsuccess-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableTableComponent,

  ],
  templateUrl: './import-leadsuccess-history.component.html',
  styleUrl: './import-leadsuccess-history.component.scss'
})
export class ImportLeadsuccessHistoryComponent implements OnInit{
baseUrl = environment.API_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
    loading: boolean = false; // Initialize loading state

  dataSource = new MatTableDataSource<any>();
  displayedColumns = [
  
    {
      key: 'sr_no',
      label: 'Sr.no',
      type: 'index', // Add this to identify it as an index column
    },

    { key: 'mobile', label: 'Mobile No' },
        { key: 'summary_message', label: 'Summary Message' },


  ];
  pipe = new DatePipe('en-US');
  
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private dialogRef: MatDialogRef<ImportLeadsuccessHistoryComponent>
  ) {}

  ngOnInit(): void {
        this.loading = true;
    // Check if data exists and has the data array
    if (this.dialogData && this.dialogData.data) {
                this.dataSource = new MatTableDataSource(this.dialogData);

              this.loading = false;

      
      this.dataSource = this.dialogData.data;
    }
  }
}
