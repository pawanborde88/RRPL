import { Component, ElementRef, QueryList, ViewChildren, inject, signal, effect, OnDestroy, AfterViewInit, OnInit } from '@angular/core';
import { TemplateComponent } from '../../template/template.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as echarts from 'echarts';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { PriceFormatPipe } from '../../../Pipes/price-format.pipe';
import { PriceShortPipe } from '../../../Pipes/price-short.pipe';
import { GreetingPipe } from '../../../Pipes/greeting.pipe';
import { AutocompleteReusableComponent } from '../../autocomplete-reusable-component/autocomplete-reusable-component.component';
import { CostomLoadingComponent } from '../../Reusable/coustom Loader/costom-loading/costom-loading.component';
import { CommonService } from '../../../Service/common/common.service';

@Component({
  selector: 'app-aichat-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TemplateComponent,
    PriceFormatPipe,
    PriceShortPipe,
    GreetingPipe,
    AutocompleteReusableComponent,
    DatePipe,
    CostomLoadingComponent,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
  ],
  templateUrl: './aichat-dashboard.html',
  styleUrl: './aichat-dashboard.scss',
})
export class AIChatDashboard implements AfterViewInit, OnDestroy, OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);

  // State
  loading = signal(false);
  insights = signal<string | null>(null);
  chartsData = signal<any[]>([]);
  projectsList = signal<any[]>([]);

  // Form
  filterForm = this.fb.group({
    prompt: ['', Validators.required],
    project_id: [[] as any[]],
    data_type: ['sales'],
    start_date: [null as Date | null],
    end_date: [null as Date | null],
  });

  @ViewChildren('chartHost') chartHosts!: QueryList<ElementRef<HTMLDivElement>>;
  private chartInstances = new Map<string, echarts.ECharts>();
  private resizeObserver?: ResizeObserver;

  constructor() {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    this.filterForm.patchValue({
      start_date: sixMonthsAgo,
      end_date: today,
    });

    // Effect to update charts when chartsData changes
    effect(() => {
      const data = this.chartsData();
      if (data.length > 0) {
        // Wait for DOM to update
        setTimeout(() => this.renderAllCharts(), 200);
      }
    });
  }

  ngOnInit() {
    this.loadProjects();
  }

  private loadProjects() {
    const sessionId = sessionStorage.getItem('session_id');
    this.commonService.fetchUserProjectDropdown(sessionId ? parseInt(sessionId) : null).subscribe({
      next: (projects) => {
        this.projectsList.set(projects || []);
      },
      error: (err) => console.error('Error loading projects:', err)
    });
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(() => {
      this.chartInstances.forEach(chart => chart.resize());
    });
    // Observer will be attached to each host as they are rendered
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    this.chartInstances.forEach(chart => chart.dispose());
    this.chartInstances.clear();
  }

  generateDashboard() {
    const formValue = this.filterForm.value;
    if (!formValue.prompt) {
      return;
    }

    this.loading.set(true);
    this.insights.set(null);
    this.chartsData.set([]);
    
    // Clear old instances
    this.chartInstances.forEach(c => c.dispose());
    this.chartInstances.clear();

    const BASE_URL = 'https://realtoerp.com/api';
    const apiUrl = `${BASE_URL}/ai_custom_graph`;

    // project_id is already an array of IDs from the autocomplete component
    const selectedProjectIds = formValue.project_id || [];

    const payload = {
      prompt: formValue.prompt,
      data_type: formValue.data_type,
      start_date: formValue.start_date ? this.formatDate(formValue.start_date) : null,
      end_date: formValue.end_date ? this.formatDate(formValue.end_date) : null,
      project_id: selectedProjectIds
    };

    this.http.post<any>(apiUrl, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.insights.set(res.ai_graph.insights);
          this.chartsData.set(res.ai_graph.charts);
        } else {
          console.error("API Error Response:", res);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error("API Error:", err);
        this.loading.set(false);
      }
    });
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  private renderAllCharts() {
    this.chartHosts.forEach((host, index) => {
      const chartConfig = this.chartsData()[index];
      if (!chartConfig) return;

      const el = host.nativeElement;
      const chartId = `chart_${index}`;
      let chart = this.chartInstances.get(chartId);

      if (!chart) {
        chart = echarts.init(el);
        this.chartInstances.set(chartId, chart);
        this.resizeObserver?.observe(el);
      }

      const options = this.convertChartJsToECharts(chartConfig);
      chart.setOption(options, true);
    });
  }

  private convertChartJsToECharts(config: any): echarts.EChartsOption {
    const { chart_type, labels, datasets, title } = config;
    const isPie = chart_type.includes('pie') || chart_type.includes('doughnut');
    
    // Modern colors palette
    const colors = ['#6366f1', '#a855f7', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4'];

    const options: echarts.EChartsOption = {
      tooltip: {
        trigger: isPie ? 'item' : 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#eef2ff',
        borderWidth: 1,
        textStyle: { color: '#312e81', fontFamily: 'Inter', fontWeight: 600 },
        extraCssText: 'backdrop-filter: blur(12px); border-radius: 20px; box-shadow: 0 20px 40px rgba(79, 70, 229, 0.1);'
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#6366f1', fontSize: 11, fontWeight: 600 },
        itemWidth: 12,
        itemHeight: 12,
      },
      grid: {
        top: '12%',
        left: '3%',
        right: '4%',
        bottom: '18%',
        containLabel: true
      },
      xAxis: isPie ? undefined : {
        type: 'category',
        data: labels,
        axisLabel: { color: '#6366f1', fontSize: 11, fontWeight: 600 },
        axisLine: { lineStyle: { color: '#eef2ff' } },
        axisTick: { show: false }
      },
      yAxis: isPie ? undefined : {
        type: 'value',
        axisLabel: { color: '#6366f1', fontSize: 11, fontWeight: 600 },
        splitLine: { lineStyle: { color: '#f5f7ff', type: 'solid' } },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: datasets.map((ds: any, idx: number) => {
        let type = chart_type;
        if (type === 'stacked_bar') type = 'bar';
        if (type === 'funnel') type = 'bar';

        const seriesData = isPie
          ? labels.map((label: string, i: number) => ({ 
              name: label, 
              value: ds.data[i],
              itemStyle: { color: colors[i % colors.length] }
            }))
          : ds.data;

        return {
          name: ds.label,
          type: isPie ? 'pie' : (type === 'line' ? 'line' : 'bar'),
          stack: chart_type === 'stacked_bar' ? 'total' : undefined,
          data: seriesData,
          radius: chart_type === 'doughnut' ? ['50%', '80%'] : (isPie ? '80%' : undefined),
          center: isPie ? ['50%', '45%'] : undefined,
          itemStyle: {
            borderRadius: isPie ? 8 : [6, 6, 0, 0],
            color: isPie ? undefined : (ds.backgroundColor || colors[idx % colors.length])
          },
          label: {
            show: isPie,
            position: 'outside',
            color: '#6366f1',
            fontSize: 11,
            fontWeight: 600,
            formatter: '{b}: {c}'
          },
          emphasis: {
            scale: true,
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          smooth: type === 'line'
        };
      })
    };

    return options;
  }

  copyInsights() {
    const text = this.insights();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        // Copied
      });
    }
  }
}
