
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core'; // Or MatMomentDateModule if using Moment.js

import { HttpClientModule } from '@angular/common/http';

import { Chart, registerables } from 'chart.js';
import { MasterService } from '../../../../Service/master.service';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

Chart.register(...registerables);
interface Project {
  project_name: string;
  project_id: string;
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
}

interface ApiResponse {
  data: {
    columns: { fieldName: string; title: string }[];
    rows: any[];
  };
}
@Component({
  selector: 'app-combination-charts',
  standalone: true,
  imports: [
    MatDatepickerModule,
    MatFormFieldModule,
    MatNativeDateModule,
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
  RouterModule, CommonModule,
AutocompleteReusableComponent
],
  templateUrl: './combination-charts.component.html',
  styleUrl: './combination-charts.component.scss'
})
export class CombinationChartsComponent implements OnInit {
  chart!: Chart;
  chartData: any[] = [];
  availableProjects: Project[] = [];

  startDate: Date | null = null;
  endDate: Date | null = null;

  selectedProjects: { [key: string]: boolean } = {};
  allProjectsSelected: boolean = true;

  dropdownButtonText: string = "Select Projects";
  dropdownButtonTitle: string = "";

  private readonly colorPalette: string[] = [
    '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', 
    '#edc9af', '#ff7f00', '#af7aa1', '#9c755f', '#bab0ac'
  ];
  private readonly colorShades: number[] = [0.8, 0.6, 0.4];

  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private service: MasterService) { }

  ngOnInit(): void {
    this.initializeChart();
    this.fetchChartData();
  }

  private initializeChart(): void {
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        }
      }
    });
  }

  fetchChartData(): void {
    const payload = {
      project_id: this.getSelectedProjectIds(),
      start_date: this.getFormattedDate(this.startDate),
      end_date: this.getFormattedDate(this.endDate),
      expense_group_id: 4,
      report_group_id: [3, 4, 5],
      time_interval_id: 1
    };

    this.service.Getchartinfo(payload).subscribe({
      next: (response: ApiResponse) => this.handleApiResponse(response),
      error: (error) => console.error("API Error:", error)
    });
  }

  private handleApiResponse(response: ApiResponse): void {
    if (!response?.data?.rows) {
      console.error("Invalid API response structure");
      return;
    }

    this.chartData = response.data.rows;
    this.availableProjects = this.getUniqueProjects(this.chartData);
    this.updateChart(response);
    this.updateDropdownButtonText();
  }

  private getSelectedProjectIds(): string[] | null {
    if (this.allProjectsSelected) return null;
    
    const selected = Object.keys(this.selectedProjects)
      .filter(key => this.selectedProjects[key])
      .map(name => this.availableProjects.find(p => p.project_name === name)?.project_id)
      .filter((id): id is string => !!id);

    return selected.length > 0 ? selected : null;
  }

  private updateChart(response: ApiResponse): void {
    const labels = response.data.columns
      .filter(col => /^\d{4}$/.test(col.fieldName))
      .map(col => col.title);

    const datasets = this.createDatasets(response.data.rows, labels);

    this.chart.data.labels = labels;
    this.chart.data.datasets = datasets;
    this.chart.update();
  }

  private createDatasets(rows: any[], labels: string[]): ChartDataset[] {
    const selectedProjectNames = this.getSelectedProjectNames();
    const datasets: ChartDataset[] = [];

    selectedProjectNames.forEach((projectName, projectIndex) => {
      const projectData = rows.filter(row => row.project_name === projectName);
      
      projectData.forEach((row, dataIndex) => {
        const color = this.getColor(projectIndex, dataIndex);
        datasets.push({
          label: `${row.project_name} - ${row.report}`,
          data: labels.map(year => row[year] || 0),
          backgroundColor: color
        });
      });
    });

    return datasets;
  }

  private getSelectedProjectNames(): string[] {
    return this.allProjectsSelected 
      ? this.availableProjects.map(p => p.project_name) 
      : Object.keys(this.selectedProjects).filter(key => this.selectedProjects[key]);
  }

  private getColor(projectIndex: number, dataIndex: number): string {
    const baseColor = this.colorPalette[projectIndex % this.colorPalette.length];
    const shadeFactor = this.colorShades[dataIndex % this.colorShades.length];
    return this.adjustColorBrightness(baseColor, shadeFactor);
  }

  private adjustColorBrightness(hexColor: string, factor: number): string {
    const hex = hexColor.replace('#', '');
    const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) * factor));
    const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) * factor));
    const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) * factor));

    return `#${[r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
  }

  private getUniqueProjects(data: any[]): Project[] {
    const uniqueProjects = new Map<string, Project>();
    data.forEach(item => {
      if (!uniqueProjects.has(item.project_name)) {
        uniqueProjects.set(item.project_name, {
          project_name: item.project_name,
          project_id: item.project_id
        });
      }
    });
    return Array.from(uniqueProjects.values());
  }

  onFilterChange(): void {
    this.fetchChartData();
  }

onProjectSelectionChange(selectedProject: any): void {
  if (selectedProject) {
    this.selectedProjects = { [selectedProject.project_name]: true };
    this.allProjectsSelected = false;
  } else {
    this.selectedProjects = {};
    this.allProjectsSelected = true;
  }
  this.updateDropdownButtonText();
}

  toggleAllProjects(): void {
    if (this.allProjectsSelected) {
      Object.keys(this.selectedProjects).forEach(key => this.selectedProjects[key] = false);
    }
    this.updateDropdownButtonText();
  }

  private updateDropdownButtonText(): void {
    const selectedProjectNames = this.getSelectedProjectNames();

    if (selectedProjectNames.length === 0) {
      this.dropdownButtonText = "Select Projects";
      this.dropdownButtonTitle = "";
    } else if (selectedProjectNames.length === this.availableProjects.length) {
      this.dropdownButtonText = "All Projects";
      this.dropdownButtonTitle = "";
    } else if (selectedProjectNames.length === 1) {
      this.dropdownButtonText = selectedProjectNames[0];
      this.dropdownButtonTitle = "";
    } else {
      this.dropdownButtonText = `${selectedProjectNames.length} Projects Selected`;
      this.dropdownButtonTitle = selectedProjectNames.join(", ");
    }
  }

  private getFormattedDate(date: Date | null): string | null {
    return date ? date.toISOString().split('T')[0] : null;
  }
}

