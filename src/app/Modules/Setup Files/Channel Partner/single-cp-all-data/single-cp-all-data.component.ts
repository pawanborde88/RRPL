import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { environment } from '../../../../../environments/environment';
import { ReceiptPreviewDialogComponent } from '../../Post Sales/Recovery/receipt-preview-dialog/receipt-preview-dialog.component';
import { CpDialogStore, DialogType } from '../../../Channel Partner Meetings/cp-report/all-cpdialog-data/store/cp-dialog.store';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-single-cp-all-data',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    TruncatePipe,
    ConfigurableAgGridDataComponent,
    AutocompleteReusableComponent
  ],
  templateUrl: './single-cp-all-data.component.html',
  styleUrl: './single-cp-all-data.component.scss',
  providers: [DatePipe]
})
export class SingleCPAllDataComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGrid!: ConfigurableAgGridDataComponent;

  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  public readonly store = inject(CpDialogStore);

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;

  channelPartnerID: string | null = null;
  readonly channelPartnerData = signal<any>(null);
  readonly isLoading = signal<boolean>(false);
  readonly cpExecutives = signal<any[]>([]);
  readonly isLoadingExecutives = signal<boolean>(false);

  ngOnInit(): void {
    this.channelPartnerID = this.route.snapshot.paramMap.get('channel_partner_id');
    if (this.channelPartnerID) {
      this.fetchSingleChannelPartner();
      this.fetchCPExecutives();
      this.initializeReportStore('site_visit');
    }
  }

  fetchCPExecutives(): void {
    if (!this.channelPartnerID) return;

    this.isLoadingExecutives.set(true);
    this.http
      .post<any[]>(`${this.baseUrl}/fetch_cp_executives`, {
        channel_partner_id: [Number(this.channelPartnerID)],
        role_id: 6,
        active_status_id: 1,
      })
      .subscribe({
        next: (res: any) => {
          this.isLoadingExecutives.set(false);
          this.cpExecutives.set(res || []);
        },
        error: (err) => {
          this.isLoadingExecutives.set(false);
          console.error(err);
          this.snackBar.open(
            'Error occurred while fetching CP executives, please try later',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }

  initializeReportStore(type: DialogType): void {
    let apiEndpoint = '';
    const channelPartnerId = this.channelPartnerID;

    switch (type) {
      case 'site_visit':
        apiEndpoint = 'fetch_project_enquiries';
        break;
      case 'token':
        apiEndpoint = 'fetch_tokens';
        break;
      case 'booking':
        apiEndpoint = 'fetch_booking';
        break;
      case 'unique_cp':
        apiEndpoint = 'fetch_all_cp_site_visit_report';
        break;
      case 'retention':
        apiEndpoint = 'fetch_all_cp_site_visit_report';
        break;
    }

    this.store.initialize({
      type: type,
      apiEndpoint: apiEndpoint,
      payload: {
        channel_partner_id: Number(channelPartnerId) || null,
        source_id: 3 // CP Source
      }
    });
  }

  onReportTypeChange(type: DialogType): void {
    this.initializeReportStore(type);
    // Explicitly trigger refresh to ensure API call happens immediately 
    // after inputs are updated via the store signals
    setTimeout(() => {
      this.agGrid?.refreshData();
    }, 50);
  }

  fetchSingleChannelPartner(): void {
    if (!this.channelPartnerID) return;

    this.isLoading.set(true);
    this.http
      .post(`${this.baseUrl}/fetch_single_channel_partner`, {
        channel_partner_id: this.channelPartnerID,
      })
      .subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          if (res) {
            this.channelPartnerData.set(res);
            this.onReportTypeChange('site_visit');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error(err);
          this.snackBar.open(
            'Error occurred while fetching data, please try later',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }

  openReceiptDialog(fileName: string | null, title: string): void {
    if (!fileName) {
      this.snackBar.open(`${title} not found`, 'Close', {
        duration: 3000,
      });
      return;
    }

    const fileUrl = `${this.storageUrl}/${fileName}`;

    this.dialog.open(ReceiptPreviewDialogComponent, {
      width: '80%',
      maxWidth: '900px',
      data: {
        title: title,
        fileUrl: fileUrl,
      },
    });
  }
}
