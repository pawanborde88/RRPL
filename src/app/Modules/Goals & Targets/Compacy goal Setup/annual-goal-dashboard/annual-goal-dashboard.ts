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
}
