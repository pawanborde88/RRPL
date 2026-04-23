import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  effect,
  DestroyRef,
  ElementRef,
  ViewChildren,
  QueryList,
  untracked
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as echarts from 'echarts';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { CostomLoadingComponent } from '../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
import { GoalDashboardFacade, GoalMetric } from './facade/goal-dashboard.facade';
import { GoalDashboardStore } from './store/goal-dashboard.store';
interface roleFilterForm {
  project_id: FormControl<number | null>;
  role_id: FormControl<number | null>;
}
@Component({
  selector: 'app-annual-goal-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AutocompleteReusableComponent,
    CostomLoadingComponent
  ],
  providers: [GoalDashboardStore, GoalDashboardFacade],
  templateUrl: './annual-goal-dashboard.html',
  styleUrl: './annual-goal-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnualGoalDashboard implements OnInit, AfterViewInit, OnDestroy {
  // ============================================
  // DEPENDENCY INJECTION
  // ============================================
  private readonly facade = inject(GoalDashboardFacade);
  private readonly snackBar = inject(MatSnackBar);

  // ============================================
  // STATE
  // ============================================
  readonly loading = this.facade.loading;
  readonly projects = this.facade.projects;
  readonly roles = this.facade.roles;
  readonly selectedProjectId = this.facade.selectedProjectId;
  readonly selectedRoleId = this.facade.selectedRoleId;
  readonly dashboardSummary = this.facade.dashboardSummary;
  readonly whatINeedData = this.facade.whatINeedData;
  protected readonly agmGoalsData = this.facade.agmGoalsData;
  readonly companyGoalMainData = this.facade.companyGoalMainData;
  readonly roleId = Number(sessionStorage.getItem('role_id'));

  readonly roleFilterForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    role_id: new FormControl<number | null>(14, Validators.required),
  });
  /** When true, the Unit Count summary card is shown. */
  readonly showUnitCount = signal(false);

  // ============================================
  // ECHARTS INSTANCES
  // ============================================
  @ViewChildren('chartHost') chartHosts!: QueryList<ElementRef<HTMLDivElement>>;
  private chartInstances = new Map<string, echarts.ECharts>();
  private resizeObserver?: ResizeObserver;

  // ============================================
  // EFFECTS (Class Field Initializers to satisfy Injection Context)
  // ============================================

  // Sync form with selected state from store
  private readonly formSyncEffect = effect(() => {
    const selectedProjectId = this.selectedProjectId();
    const selectedRoleId = this.selectedRoleId();

    untracked(() => {
      const currentProj = this.roleFilterForm.get('project_id')?.value;
      const currentRole = this.roleFilterForm.get('role_id')?.value;

      if (selectedProjectId && selectedProjectId !== currentProj) {
        this.roleFilterForm.patchValue({ project_id: selectedProjectId }, { emitEvent: false });
      }
      if (selectedRoleId && selectedRoleId !== currentRole) {
        this.roleFilterForm.patchValue({ role_id: selectedRoleId }, { emitEvent: false });
      }
    });
  });

  // Re-render charts when data changes
  private readonly chartsEffect = effect(() => {
    // Only capture dependencies we want to react to
    const summary = this.dashboardSummary();
    const whatINeed = this.whatINeedData();
    const agmGoals = this.agmGoalsData();
    const companyMain = this.companyGoalMainData();

    // Debounce the update slightly to ensure DOM is ready and prevent thrashing
    untracked(() => {
      if (this.chartInstances.size > 0 || (this.chartHosts && this.chartHosts.length > 0)) {
        setTimeout(() => this.updateCharts(), 100);
      }
    });
  });

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================
  ngOnInit(): void {
    // Initialize data fetching
    this.facade.initialize();
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    // Initial chart render with a small delay for container sizing
    setTimeout(() => this.initCharts(), 300);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chartInstances.forEach(chart => chart.dispose());
    this.chartInstances.clear();
  }

  // ============================================
  // FILTER ACTIONS
  // ============================================
  onApplyFilter(): void {
    const { project_id, role_id } = this.roleFilterForm.value;
    this.facade.applyFilters(role_id ?? null, project_id ?? null);
  }

  // ============================================
  // CHART LOGIC
  // ============================================
  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.chartInstances.forEach(c => c.resize());
    });
    this.chartHosts.forEach(h => this.resizeObserver?.observe(h.nativeElement));
  }

  private initCharts(): void {
    if (!this.chartHosts) return;
    this.chartHosts.forEach(host => {
      const el = host.nativeElement;
      const id = el.getAttribute('data-chart-id');
      if (id && el.clientWidth > 0) {
        this.renderChartInstance(id, el);
      }
    });
  }

  private updateCharts(): void {
    if (!this.chartHosts) return;
    this.chartHosts.forEach(host => {
      const el = host.nativeElement;
      const id = el.getAttribute('data-chart-id');
      if (id) {
        this.renderChartInstance(id, el);
      }
    });
  }

  private renderChartInstance(id: string, el: HTMLDivElement): void {
    const options = this.getChartOptions(id);
    if (!options) return;

    let chart = this.chartInstances.get(id);
    if (!chart) {
      chart = echarts.init(el);
      this.chartInstances.set(id, chart);
    }
    chart.setOption(options, true);
  }

  private getChartOptions(id: string): echarts.EChartsOption | null {
    const summary = this.dashboardSummary();

    if (!summary) return null;

    switch (id) {
      case 'monthlyBookingChart': {
        const months = summary.monthly_units?.map(m => m.month.toUpperCase()) || [];
        const values = summary.monthly_units?.map(m => Number(m.total_units)) || [];

        return {
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 0,
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            padding: [8, 12],
            textStyle: { color: '#0f172a', fontWeight: 'bold', fontSize: 10 },
            formatter: (params: any) => `
              <div class="flex items-center gap-2">
                <span class="text-slate-400 font-black uppercase text-[8px] tracking-widest">${params[0].name}</span>
                <span class="text-indigo-600 font-bold ml-auto">${params[0].value} Units</span>
              </div>
            `
          },
          grid: { left: '2%', right: '2%', bottom: '2%', top: '10%', containLabel: true },
          xAxis: {
            type: 'category',
            data: months,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#94a3b8', fontSize: 9, fontWeight: 700, margin: 12 }
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'solid', color: '#f1f5f9' } },
            axisLabel: { color: '#cbd5e1', fontSize: 9, fontWeight: 600 }
          },
          series: [{
            data: values,
            type: 'bar',
            barWidth: '25%',
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#6366f1' },
                { offset: 1, color: '#8b5cf6' }
              ])
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#4f46e5' },
                  { offset: 1, color: '#6366f1' }
                ])
              }
            },
            animationDuration: 2000,
            animationEasing: 'cubicOut'
          }]
        };
      }

      case 'inventoryBreakdownChart': {
        const data = summary.inventory_units?.map(item => ({
          name: item.inventory_type,
          value: Number(item.total_quantity)
        })) || [];

        return {
          tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 0,
            padding: [4, 8],
            textStyle: { fontSize: 10, fontWeight: 'bold' },
            formatter: '{b}: <span style="color:#6366f1;font-weight:900">{c}</span>'
          },
          legend: {
            orient: 'horizontal',
            bottom: '0%',
            left: 'center',
            itemGap: 8,
            textStyle: { color: '#94a3b8', fontSize: 8, fontWeight: 'bold' },
            itemWidth: 6,
            itemHeight: 6,
            icon: 'circle'
          },
          series: [{
            name: 'Inventory Mix',
            type: 'pie',
            radius: ['65%', '85%'],
            center: ['50%', '42%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 2, borderColor: '#fff', borderWidth: 1 },
            label: { show: false },
            emphasis: {
              label: {
                show: true,
                fontSize: 9,
                fontWeight: 'bold',
                formatter: '{d}%'
              }
            },
            data: data,
            color: ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899']
          }]
        };
      }

      default:
        return null;
    }
  }

  // ============================================
  // EXPORT LOGIC
  // ============================================
  exportToExcel(): void {
    const data = this.companyGoalMainData();
    if (!data || data.length === 0) {
      this.snackBar.open('No data available to export', 'Close', { duration: 3000 });
      return;
    }

    try {
      const exportData = data.map((goal: any, index: number) => {
        const row: any = {
          'Sr. No': index + 1,
          'Name': goal.user_name,
          'Project / Territory': goal.project_name,
          'Reporting To': goal.manager_name,
          'FY Units': goal.total_unit,
        };

        if (this.showUnitCount()) {
          row['Unit Count'] = goal.unit_count ?? goal.total_unit;
        }

        goal.quarterwise_unit?.forEach((q: any, i: number) => {
          row[`Q${i + 1}`] = q.total_unit;
        });

        return row;
      });

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-size columns
      const maxWidth = 50;
      const minWidth = 10;
      const keys = Object.keys(exportData[0] || {});
      ws['!cols'] = keys.map(key => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map(row => String(row[key] || '').length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, minWidth), maxWidth) };
      });

      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Annual Goals');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Annual_Goal_Report_${dateStr}.xlsx`);

      this.snackBar.open('Report exported successfully', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Export failed:', error);
      this.snackBar.open('Failed to export report', 'Close', { duration: 3000 });
    }
  }

  // ============================================
  // PRINT LOGIC
  // ============================================
  onPrintGoal(goal: any): void {
    if (!goal || !goal.id) return;
    this.facade.fetchFullGoal(goal.id).subscribe({
      next: (res) => {
        if (res && res.status) {
          const printData = { ...res.data, participantDetails: goal };
          this.printGoalData(printData);
        } else {
          this.snackBar.open('Failed to fetch goal data for printing', 'Close', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('Print fetch failed:', err);
        this.snackBar.open('Error fetching goal data', 'Close', { duration: 3000 });
      }
    });
  }

  private printGoalData(data: any): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = this.generatePrintHtml(data);
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Small delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Optionally close after print dialog closes, but some browsers block if done too quickly.
      // printWindow.close();
    }, 500);
  }

  private generatePrintHtml(data: any): string {
    const pDetails = data.participantDetails || {};

    // 1. Roles
    let rolesHtml = '';
    if (data.roles && Array.isArray(data.roles)) {
      data.roles.forEach((role: any, idx: number) => {
        let actionsHtml = '';
        if (role.actions && Array.isArray(role.actions)) {
          actionsHtml = role.actions.map((item: string) => `<li>${item}</li>`).join('');
        }

        rolesHtml += `
          <div class="role-section break-inside-avoid">
            <div class="role-header">
              <span class="role-badge">Role ${role.role_no || idx + 1}</span>
              <span class="role-title">${role.title || 'N/A'}</span>
            </div>
            <div class="role-metrics">
              <div class="metric-box">
                <div class="metric-label">Measure of Success</div>
                <div class="metric-value">${role.measure || 'N/A'}</div>
              </div>
              <div class="metric-box">
                <div class="metric-label">Annual Target</div>
                <div class="metric-value font-highlight">${role.target || 'N/A'}</div>
              </div>
            </div>
            <div class="role-actions">
              <div class="metric-label" style="margin-bottom: 5px;">Key Action Items:</div>
              <ul>${actionsHtml || '<li>None specified</li>'}</ul>
            </div>
          </div>
        `;
      });
    }

    // 2. Monthly Target
    const monthsOrder = ['apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
    let monthlyHtml = `
      <table class="data-table">
        <thead>
          <tr>${monthsOrder.map(m => `<th>${m.toUpperCase()}</th>`).join('')}</tr>
        </thead>
        <tbody>
          <tr>${monthsOrder.map(m => {
      const mData = data.monthly?.find((x: any) => x.month.toLowerCase() === m);
      return `<td>${mData ? mData.units : 0}</td>`;
    }).join('')}</tr>
        </tbody>
      </table>
    `;

    // 3. Quarterly Combos (Units, Conversion, TAT, Needed)
    let quartersHtml = '';
    const qData = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
      const qUnits = data.quarterly?.find((x: any) => x.quarter === q)?.total_units || 0;
      const qConv = data.conversion?.find((x: any) => x.quarter === q)?.conversion_ratio || 0;
      const qTat = data.tat?.find((x: any) => x.quarter === q) || {};
      const qNeeded = data.needed?.find((x: any) => x.quarter === q)?.needed_units || 0;
      return {
        q,
        units: qUnits,
        conv: qConv,
        atat: qTat.agreement_tat || 0,
        dtat: qTat.disbursement_tat || 0,
        needed: qNeeded
      };
    });

    quartersHtml = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Quarter</th>
            <th>Booking Units</th>
            <th>Conversion Ratio</th>
            <th>Agreement TAT (Days)</th>
            <th>Disbursement TAT (Days)</th>
            <th>Hiring Needed</th>
          </tr>
        </thead>
        <tbody>
          ${qData.map(d => `
            <tr>
              <td style="font-weight: bold;">${d.q}</td>
              <td class="text-highlight">${d.units}</td>
              <td>${d.conv}%</td>
              <td>${d.atat}</td>
              <td>${d.dtat}</td>
              <td>${d.needed}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // 4. Inventory
    let inventoryHtml = '<div class="tags-container">';
    if (data.inventory && typeof data.inventory === 'object') {
      Object.keys(data.inventory).forEach(key => {
        inventoryHtml += `<div class="tag-box"><span class="tag-label">${key}</span><span class="tag-val">${data.inventory[key]} Units</span></div>`;
      })
    } else {
      inventoryHtml += '<p>No specific inventory breakdown.</p>';
    }
    inventoryHtml += '</div>';

    // 5. Team Need
    let teamHtml = '<div class="tags-container">';
    if (data.team) {
      if (data.team.sale_team) teamHtml += `<div class="tag-box"><span class="tag-label">Sales</span><span class="tag-val">${data.team.sale_team}</span></div>`;
      if (data.team.crm_team) teamHtml += `<div class="tag-box"><span class="tag-label">CRM</span><span class="tag-val">${data.team.crm_team}</span></div>`;
      if (data.team.pre_sale_team) teamHtml += `<div class="tag-box"><span class="tag-label">Pre-Sales</span><span class="tag-val">${data.team.pre_sale_team}</span></div>`;
      if (data.team.source_team) teamHtml += `<div class="tag-box"><span class="tag-label">Sourcing</span><span class="tag-val">${data.team.source_team}</span></div>`;
      if (data.team.gre !== undefined) teamHtml += `<div class="tag-box"><span class="tag-label">GRE</span><span class="tag-val">${data.team.gre}</span></div>`;
      teamHtml += `<div class="tag-box bg-highlight"><span class="tag-label text-white">Total</span><span class="tag-val text-white">${data.team.total || 0}</span></div>`;
    } else {
      teamHtml += '<p>No team sizing defined.</p>';
    }
    teamHtml += '</div>';

    // 6. What I Need
    let whatINeedHtml = '<div class="what-i-need-grid">';
    if (data.what_i_need && data.what_i_need.length) {
      data.what_i_need.forEach((item: any) => {
        whatINeedHtml += `
               <div class="need-card avoid-break">
                  <div class="need-card-header">${item.category}</div>
                  <div class="need-card-body">
                    <ul>${(item.description || []).map((d: string) => `<li>${d}</li>`).join('')}</ul>
                  </div>
               </div>
            `;
      });
    } else {
      whatINeedHtml += '<p>No additional support items requested.</p>';
    }
    whatINeedHtml += '</div>';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>RRPL - Goal Commitment - ${pDetails.user_name || 'User'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          :root {
            --primary: #0d4678;
            --primary-light: #eff6ff;
            --secondary: #475569;
            --dark: #0f172a;
            --gray-subtle: #f8fafc;
            --gray-border: #cbd5e1;
            --text-main: #334155;
            --text-muted: #64748b;
            --bg-page: #ffffff;
          }

          @page { size: A4; margin: 0; }
          
          body { 
            font-family: 'Inter', sans-serif; 
            color: var(--text-main); 
            line-height: 1.35; 
            margin: 0; 
            padding: 0; 
            background: var(--bg-page); 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          
          .page { 
            width: 210mm; 
            min-height: 297mm; 
            background: white; 
            padding: 10mm 15mm; 
            margin: 0 auto; 
            box-sizing: border-box; 
            position: relative;
          }
          
          /* Typography */
          h1 { color: var(--dark); font-size: 16px; font-weight: 900; letter-spacing: -0.5px; margin: 0; text-transform: uppercase; }
          h2 { color: var(--primary); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--gray-border); padding-bottom: 4px; margin-top: 0; margin-bottom: 12px; }
          
          /* Header Layout */
          .header-brand { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid var(--dark); padding-bottom: 8px; margin-bottom: 15px; }
          .header-meta { text-align: right; }
          .header-meta p { margin: 0; font-size: 8px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

          /* User Profile Grid - Premium Accent */
          .profile-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 12px; 
            background: var(--primary-light); 
            color: var(--dark); 
            padding: 10px 14px; 
            border: 1px solid var(--primary-light);
            border-left: 4px solid var(--primary);
            border-radius: 4px 6px 6px 4px; 
            margin-bottom: 20px; 
          }
          .profile-item { display: flex; flex-direction: column; }
          .profile-label { font-size: 7px; text-transform: uppercase; letter-spacing: 1px; color: var(--secondary); margin-bottom: 2px; font-weight: 800; }
          .profile-val { font-size: 11px; font-weight: 900; color: var(--dark); }
          .profile-val.highlight { font-size: 13px; color: var(--primary); }

          /* Utilities */
          .section { margin-bottom: 15px; }
          .avoid-break, .role-section { break-inside: avoid; page-break-inside: avoid; }
          .font-highlight { color: var(--primary); font-weight: 900 !important; }
          .text-highlight { color: var(--dark) !important; font-weight: 900 !important; }

          /* Roles Layout */
          .roles-container { display: flex; flex-direction: column; gap: 10px; }
          .role-section { border: 1px solid var(--gray-border); border-radius: 6px; overflow: hidden; background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
          .role-header { background: var(--gray-subtle); padding: 6px 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--gray-border); }
          .role-badge { background: var(--primary); color: white; padding: 3px 8px; border-radius: 12px; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
          .role-title { font-size: 11px; font-weight: 800; color: var(--dark); }
          
          .role-metrics { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--gray-border); background: white; }
          .metric-box { padding: 6px 12px; border-right: 1px solid var(--gray-border); }
          .metric-box:last-child { border-right: none; }
          .metric-label { font-size: 8px; color: var(--secondary); text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
          .metric-value { font-size: 10px; font-weight: 700; color: var(--dark); margin-top: 2px; }
          
          .role-actions { padding: 6px 12px; background: white; }
          .role-actions ul { margin: 0; padding-left: 15px; color: var(--text-main); font-size: 9.5px; }
          .role-actions li { margin-bottom: 3px; }
          .role-actions li:last-child { margin-bottom: 0; }

          /* Modern Tabular Design */
          .data-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; border-bottom: 2px solid var(--primary); }
          .data-table th, .data-table td { padding: 8px 10px; text-align: center; font-size: 9px; border-right: none; border-left: none; }
          .data-table th { font-weight: 800; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px; background: white; border-top: 2px solid var(--dark); border-bottom: 1px solid var(--gray-border); }
          .data-table td { color: var(--dark); font-weight: 600; border-bottom: 1px solid var(--gray-subtle); }
          .data-table tr:last-child td { border-bottom: none; }

          /* Tags for Inventory & Team - Premium Pills */
          .tags-container { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
          .tag-box { display: inline-flex; align-items: stretch; border: 1px solid var(--gray-border); border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
          .tag-label { display: flex; align-items: center; background: var(--primary-light); padding: 4px 10px; font-size: 8px; font-weight: 900; text-transform: uppercase; color: var(--primary); border-right: 1px solid var(--gray-border); }
          .tag-val { display: flex; align-items: center; padding: 4px 10px; font-size: 9px; font-weight: 800; color: var(--dark); }

          /* What I Need Grid */
          .what-i-need-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .need-card { border: 1px solid var(--gray-border); border-radius: 6px; background: white; border-top: 3px solid var(--primary); box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
          .need-card-header { background: white; color: var(--dark); padding: 8px 12px; font-size: 9px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid var(--gray-subtle); letter-spacing: 0.5px; }
          .need-card-body { padding: 8px 12px; }
          .need-card-body ul { margin: 0; padding-left: 15px; font-size: 9.5px; color: var(--text-main); }
          .need-card-body li { margin-bottom: 3px; font-weight: 500; }

          /* Footer */
          .footer { position: absolute; bottom: 10mm; left: 15mm; right: 15mm; display: flex; justify-content: space-between; border-top: 1px solid var(--gray-border); padding-top: 10px; font-size: 7px; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }

          @media print {
             .page { margin: 0; padding: 10mm 15mm; box-shadow: none; border: none; min-height: auto; width: 100%; }
             body { background: white; }
          }
        </style>
      </head>
      <body>

        <!-- PAGE 1: Core Goal & Roles -->
        <div class="page" style="page-break-after: always; break-after: page;">
          <div class="header-brand">
            <div>
              <h1>Strategic Goal Commitment</h1>
              <h1 style="color: var(--primary); font-size: 14px;">FY 2026–27</h1>
            </div>
            <div class="header-meta">
              <p>RRPL Performance Tracker</p>
              <p>Generated: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div class="profile-grid avoid-break">
            <div class="profile-item">
              <span class="profile-label">Participant Name</span>
              <span class="profile-val">${pDetails.user_name || 'N/A'}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">Project / Territory</span>
              <span class="profile-val">${pDetails.project_name || 'N/A'}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">Reporting To</span>
              <span class="profile-val">${pDetails.manager_name || 'N/A'}</span>
            </div>
            <div class="profile-item">
              <span class="profile-label">Annual Unit Goal</span>
              <span class="profile-val highlight">${data.main?.my_goal || pDetails.total_unit || 0}</span>
            </div>
          </div>

          <div class="section avoid-break">
             <h2>Monthly Unit Target Distribution</h2>
             ${monthlyHtml}
          </div>

          <div class="section">
             <h2>Defined Roles & Key Objectives</h2>
             <div class="roles-container">
               ${rolesHtml || '<p>No specific roles defined.</p>'}
             </div>
          </div>
          
       
        </div>

        <!-- PAGE 2: Execution Details -->
        <div class="page">
          <div class="header-brand">
            <div>
              <h1>Execution & Strategy Breakdown</h1>
              <h1 style="color: var(--primary); font-size: 14px;">FY 2026–27</h1>
            </div>
            <div class="header-meta">
              <p>${pDetails.user_name || 'Participant'}</p>
              <p>${pDetails.project_name || 'Project'}</p>
            </div>
          </div>

          <div class="section avoid-break">
             <h2>Quarterly Performance Benchmarks</h2>
             ${quartersHtml}
          </div>

          <div class="section avoid-break">
             <h2>Inventory Type Targets</h2>
             ${inventoryHtml}
          </div>

          <div class="section avoid-break">
             <h2>Team Sizing / Manpower Setup</h2>
             ${teamHtml}
          </div>

          <div class="section avoid-break">
             <h2>Direct Support & Strategy Requirements</h2>
             ${whatINeedHtml}
          </div>

       
        </div>

      </body>
      </html>
    `;
  }
}
