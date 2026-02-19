
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { AngularMaterialModule } from "../../../../../angular-material.module";
import { MasterService } from "../../../../Service/master.service";

Chart.register(...registerables);

@Component({
  selector: 'app-pie-charts',
  standalone: true,
  imports: [  CommonModule,
      RouterModule,
      HttpClientModule,
      FormsModule,
       AngularMaterialModule, RouterModule, CommonModule
  ],
  templateUrl: './pie-charts.component.html',
  styleUrl: './pie-charts.component.scss'
})
export class PieChartsComponent implements OnInit {

  constructor(private service: MasterService) { }

  chartdata: any[] = [];
  labeldata: string[] = [];
  enquiryData: number[] = [];
  siteVisitData: number[] = [];
  bookingData: number[] = [];
  colordata: string[] = [];

  ngOnInit(): void {
    // API payload
    const payload = {
      project_id: null,
      start_date: '2025-02-14',
      end_date: '2025-02-28',
      expense_group_id: 4,
      report_group_id: [3, 4, 5],
      time_interval_id: 1
    };

    this.service.Getchartinfo(payload).subscribe(result => {
      this.chartdata = result.data.rows; // Assuming the data is in "rows" array

      if (this.chartdata != null) {
        const projectMap = new Map();

        for (let i = 0; i < this.chartdata.length; i++) {
          const projectName = this.chartdata[i].project_name;
          const report = this.chartdata[i].report;
          const value = this.chartdata[i]['2025'];

          if (!projectMap.has(projectName)) {
            projectMap.set(projectName, { enquiries: 0, siteVisits: 0, bookings: 0 });
          }

          const projectData = projectMap.get(projectName);

          if (report === 'Leads') {
            projectData.enquiries = value;
          } else if (report === 'Site Visits') {
            projectData.siteVisits = value;
          } else if (report === 'Bookings') {
            projectData.bookings = value;
          }
        }

        projectMap.forEach((value, key) => {
          this.labeldata.push(key);
          this.enquiryData.push(value.enquiries);
          this.siteVisitData.push(value.siteVisits);
          this.bookingData.push(value.bookings);
          this.colordata.push(this.getRandomColor());
        });

        // Now render the charts after data is fetched and processed
        this.RenderGroupedBarChart();
        this.RenderBubbleChart();
        this.RenderPieChart();
        // this.RenderDoughnutCharts();
       
        this.RenderRadarChart();
      }
    });
  }

  // Function to render the Grouped Bar Chart
  RenderGroupedBarChart() {
    const myChart = new Chart('barchart', {
      type: 'bar',
      data: {
        labels: this.labeldata,
        datasets: [
          {
            label: 'Enquiries',
            data: this.enquiryData.map(value => value || 0), // Ensures 0 values are displayed
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          },
          {
            label: 'Site Visits',
            data: this.siteVisitData.map(value => value || 0),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Bookings',
            data: this.bookingData.map(value => value || 0),
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          y: {
            beginAtZero: true, // Ensure Y-axis starts at 0
            ticks: {
              precision: 0 // Prevent decimal values
            }
          }
        }
      }
    });
  }
  

  // Function to render the Bubble Chart
  RenderBubbleChart() {
    const ctx = document.getElementById('bubchart') as HTMLCanvasElement;
    const myChart = new Chart(ctx, {
      type: 'bubble',
      data: {
        labels: this.labeldata, // Project Names
        datasets: [
          {
            label: 'Enquiries',
            data: this.enquiryData.map((enquiry, index) => ({
              x: index, // Using index to map project names
              y: enquiry ?? 0,
              r: 10
            })),
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          },
          {
            label: 'Site Visits',
            data: this.siteVisitData.map((siteVisit, index) => ({
              x: index,
              y: siteVisit ?? 0,
              r: 8
            })),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Bookings',
            data: this.bookingData.map((booking, index) => ({
              x: index,
              y: booking ?? 0,
              r: 6
            })),
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          x: {
            type: 'category', // Fix for project names
            labels: this.labeldata,
            position: 'bottom',
            ticks: {
              autoSkip: false // Ensure all project names appear
            }
          },
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  

  // Function to render the Pie Chart
  selectedPieType: string = 'enquiries';
  selectedDoughnutType: string = 'siteVisits';
  selectedRadarType: string = 'bookings';
  
  pieChart: any;
  doughnutChart: any;
  radarChart: any;
  
  updatePieChart(event: any) {
    this.selectedPieType = event.target.value;
    this.RenderPieChart();
  }
  
  // updateDoughnutChart(event: any) {
  //   this.selectedDoughnutType = event.target.value;
  //   this.RenderDoughnutCharts();
  // }
  
  updateRadarChart(event: any) {
    this.selectedRadarType = event.target.value;
    this.RenderRadarChart();
  }
  
  RenderPieChart() {
    if (this.pieChart) {
      this.pieChart.destroy();
    }
  
    let data = this.getFilteredData(this.selectedPieType);
    
    // Define colors from light to dark
    let colors = ['#6BB9F0', '#4DA9E9', '#3B88C3', '#1F5D8A', '#144F72', '#0A3452'];
  
    // Find the smallest value's index
    let minValueIndex = data.indexOf(Math.min(...data));
  
    // Assign the darkest color to the lowest value
    let backgroundColors = data.map((_, index) => (index === minValueIndex ? '#0A3452' : colors[index % colors.length]));
  
    this.pieChart = new Chart('piechart', {
      type: 'pie',
      data: {
        labels: this.labeldata,
        datasets: [{
          label: this.getChartLabel(this.selectedPieType),
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 0 // Removes white border lines
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false // Hides the legend
          },
          title: {
            display: true,
            text: 'Projects by ' + this.getChartLabel(this.selectedPieType),
            font: {
              size: 16
            },
            color: '#333'
          },
          tooltip: {
            enabled: true,
            backgroundColor: '#ffffff',
            titleColor: '#333',
            bodyColor: '#333',
            borderColor: '#ccc',
            borderWidth: 1
          },
        }
      }
    });
  }
  
  

  
  
  
  
  
  
  // Function to Generate Unique Colors for Each Project
  generateProjectColors(count: number): string[] {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  }
  
  
  
  adjustColorOpacity(color: string, opacity: number): string {
    if (color.startsWith('#')) {
      // Convert HEX to RGB
      const r = parseInt(color.substring(1, 3), 16);
      const g = parseInt(color.substring(3, 5), 16);
      const b = parseInt(color.substring(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else if (color.startsWith('rgb')) {
      // Convert existing RGB to RGBA
      return color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
    }
    return color; // Return original if format is unknown
  }
  
  

  
  
  RenderRadarChart() {
    if (this.radarChart) {
      this.radarChart.destroy();
    }
    
    let data = this.getFilteredData(this.selectedRadarType);
    
    this.radarChart = new Chart('rochart', {
      type: 'radar',
      data: {
        labels: this.labeldata,
        datasets: [{
          label: this.getChartLabel(this.selectedRadarType),
          data: data,
          backgroundColor: 'rgba(75, 192, 192, 0.4)',
          borderColor: '#4BC0C0',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: false },
          tooltip: { enabled: true },
        },
      }
    });
  }
  
  getFilteredData(chartType: string): number[] {
    if (chartType === 'enquiries') return this.enquiryData;
    if (chartType === 'siteVisits') return this.siteVisitData;
    return this.bookingData;
  }
  
  getChartLabel(chartType: string): string {
    if (chartType === 'enquiries') return 'Enquiries';
    if (chartType === 'siteVisits') return 'Site Visits';
    return 'Bookings';
  }
  

  // // Function to adjust color opacity (for site visits and bookings)
  // adjustColorOpacity(color: string, opacity: number): string {
  //   return color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
  // }

  // Function to get a random color for each project
  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}
