import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { AdvancedFilterDialogComponent } from '../Reusable/Column selector Dialog/advanced-filter-dialog/advanced-filter-dialog.component';
import { AdvancedSearchFilterDialogComponent } from '../advanced-search-filter-dialog/advanced-search-filter-dialog.component';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    AdvancedFilterDialogComponent
  ],
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {
  @Input() columns: any[] = [];
  @Input() selectedColumnKeys: string[] = [];
  @Input() onFilterChange: ((selectedColumns: string[]) => void) | null = null;
  @Input() filterData: any = {};
  @Output() filterApplied = new EventEmitter<any>();

  private readonly dialog = inject(MatDialog);

  constructor() { }

  ngOnInit(): void {
    // Initialization logic (if needed) can go here
  }

  openAdvancedFilterDialog(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '350px';
    dialogConfig.position = { top: '70px', right: '0px' };
    dialogConfig.height = 'calc(100vh - 70px)';
    dialogConfig.panelClass = 'right-side-dialog';
    dialogConfig.hasBackdrop = true;

    // Pass data to the dialog
    dialogConfig.data = {
      projects: this.filterData.projects || [],
      tokenTypes: this.filterData.tokenTypes || [],
      sources: this.filterData.sources || [],
      sourceDetails: this.filterData.sourceDetails || [],
      statuses: this.filterData.statuses || []
    };

    const dialogRef = this.dialog.open(AdvancedSearchFilterDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.filterApplied.emit(result);
      }
    });
  }
}
