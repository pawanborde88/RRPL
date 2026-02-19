import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { CommonService } from '../../../../Service/common/common.service';
import { catchError, of, retry, tap, finalize } from 'rxjs';
import { DailyReportResponse, Project, Telecaller, SalesExecutive } from './dsr-report.models';
import { hasReportData, hasAnyReportData } from './dsr-report.utils';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class DsrReportStore {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly commonService = inject(CommonService);

  private readonly API_URL = `${environment.API_URL}/fetch_daily_count_report`;

  // --- State ---
  readonly loading = signal<boolean>(false);
  readonly projects = signal<Project[]>([]);
  readonly telecallers = signal<Telecaller[]>([]);
  readonly salesExecutives = signal<SalesExecutive[]>([]);
  readonly dailyReport = signal<DailyReportResponse | null>(null);
  readonly error = signal<string | null>(null);

  // --- Session Data ---
  readonly roleId = Number(sessionStorage.getItem('role_id')) || null;
  readonly userId = Number(sessionStorage.getItem('session_id')) || null;
  private readonly roleData = sessionStorage.getItem('role_id');

  // --- Computed ---
  readonly hasAnyData = computed(() => hasAnyReportData(this.dailyReport()));

  readonly hasLeadsData = computed(() => hasReportData(this.dailyReport()?.leads_report));
  readonly hasEnquiryData = computed(() => hasReportData(this.dailyReport()?.enquiry_report));
  readonly hasBookingData = computed(() => hasReportData(this.dailyReport()?.booking_report));

  readonly hasTokenData = computed(() => {
    const report = this.dailyReport();
    if (!report?.token_report?.types?.length) return false;
    const items = report.token_report.types;
    const hasData = items.some(item => (item.today > 0 || item.monthly > 0 || item.till_date > 0));
    const totals = report.token_report.totals;
    return hasData || (totals && (totals.today > 0 || totals.monthly > 0 || totals.till_date > 0));
  });

  readonly hasPostSalesData = computed(() => {
    const report = this.dailyReport();
    if (!report?.post_sales_report) return false;
    const { total_agreements, total_disbursements } = report.post_sales_report;
    const hasAgreements = total_agreements && (total_agreements.today > 0 || total_agreements.monthly > 0 || total_agreements.till_date > 0);
    const hasDisbursements = total_disbursements && (total_disbursements.today > 0 || total_disbursements.monthly > 0 || total_disbursements.till_date > 0);
    return hasAgreements || hasDisbursements;
  });

  // --- Actions ---

  fetchAllProjects(): void {
    this.commonService
      .fetchUserProjectDropdown(this.userId)
      .pipe(
        tap((projects) => this.projects.set(projects || [])),
        catchError((error) => {
          this.snackBar.open('Unable to fetch projects.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
      )
      .subscribe();
  }


  loadFilters(projectId: number) {
    if (!projectId) {
      this.telecallers.set([]);
      this.salesExecutives.set([]);
      return;
    }

    if (this.roleId !== 7) {
      this.commonService.fetchTelecallerDropdown([projectId]).pipe(
        retry({ count: 2, delay: 500 }),
        catchError(() => of([]))
      ).subscribe(res => {
        const telecallers = res.map((item: any) => ({
          ...item,
          full_name: `${item.first_name} ${item.last_name}`,
        }));
        this.telecallers.set(telecallers);
      });
    }

    if (this.roleId !== 13) {
      this.commonService.fetchSalesExecutives(projectId).pipe(
        retry({ count: 2, delay: 500 }),
        catchError(() => of([]))
      ).subscribe(res => this.salesExecutives.set(res || []));
    }
  }

  fetchReport(payload: any) {
    this.loading.set(true);
    this.dailyReport.set(null);
    this.error.set(null);

    this.http.post<DailyReportResponse>(this.API_URL, payload).pipe(
      retry({ count: 2, delay: 1000 }),
      catchError(err => {
        this.handleError(err, 'Failed to fetch daily report.');
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    ).subscribe(res => this.dailyReport.set(res));
  }

  clearReport() {
    this.dailyReport.set(null);
    this.telecallers.set([]);
    this.salesExecutives.set([]);
  }

  getCalculatedRoleId(): string | number | null {
    if (!this.roleData) return null;
    const roles = this.roleData.split(',').map(Number);
    if (roles.includes(7) && roles.includes(13)) return 7;
    if (roles.includes(7)) return 7;
    if (roles.includes(13)) return 13;
    return this.roleData;
  }

  private handleError(error: any, defaultMessage: string) {
    const message = error?.error?.message || defaultMessage;
    this.error.set(message);
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
