import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { MasterService } from "../../../../Service/master.service";

Chart.register(...registerables);
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss'
})
export class DonutChartComponent implements OnInit {

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
          // this.colordata.push(this.getRandomColor());
        });

        // Now render the charts after data is fetched and processed
  

        this.RenderDoughnutCharts();
       
  
      }
    });

  }
  doughnutChart: any;
  selectedDoughnutType: string = 'siteVisits';

  updateDoughnutChart(event: any) {
    this.selectedDoughnutType = event.target.value;
    this.RenderDoughnutCharts();
  }
  generateProjectColors(count: number): string[] {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  }




  RenderDoughnutCharts() {
    const projectColors = this.generateProjectColors(this.labeldata.length);
  
    // Multi-Ring Doughnut Chart (Enquiries, Site Visits, Bookings)
    const multiRingChart = new Chart('dochartMulti', {
      type: 'doughnut',
      data: {
        labels: this.labeldata, // Project Names as Labels
        datasets: [
          {
            label: 'Enquiries',
            data: this.enquiryData,
            backgroundColor: projectColors.map(color => this.adjustColorOpacity(color, 1)), // Original color
            borderWidth: 2
          },
          {
            label: 'Site Visits',
            data: this.siteVisitData,
            backgroundColor: projectColors.map(color => this.adjustColorOpacity(color, 0.6)), // Lighter shade
            borderWidth: 2
          },
          {
            label: 'Bookings',
            data: this.bookingData,
            backgroundColor: projectColors.map(color => this.adjustColorOpacity(color, 0.4)), // Even lighter shade
            borderWidth: 2
          }
        ]
      },
      options: {
        cutout: '50%', // Controls ring thickness
        plugins: {
          legend: { display: false }, // Hides legend
          tooltip: {
            callbacks: {
              label: function(tooltipItem: any) {
                const datasetLabel = tooltipItem.dataset.label || '';
                const dataValue = tooltipItem.raw || 0;
                const projectName = tooltipItem.chart.data.labels[tooltipItem.dataIndex];
  
                return `${datasetLabel}: ${dataValue} (${projectName})`;
              }
            }
          }
        }
      }
    });
  
    // Single-Ring Doughnut Chart (Overall Summary)
    const totalEnquiries = this.enquiryData.reduce((a, b) => a + b, 0);
const totalSiteVisits = this.siteVisitData.reduce((a, b) => a + b, 0);
const totalBookings = this.bookingData.reduce((a, b) => a + b, 0);

const summaryChart = new Chart('dochartSummary', {
  type: 'doughnut',
  data: {
    labels: ['Total Enquiries', 'Total Site Visits', 'Total Bookings'],
    datasets: [
      {
        label: 'Overall Summary',
        data: [totalEnquiries, totalSiteVisits, totalBookings],
        backgroundColor: [
          this.adjustColorOpacity('#FF6384', 0.8), // Soft red
          this.adjustColorOpacity('#36A2EB', 0.8), // Soft blue
          this.adjustColorOpacity('#FFCE56', 0.8)  // Soft yellow
        ],
        hoverBackgroundColor: [
          this.adjustColorOpacity('#FF6384', 1), // Darker on hover
          this.adjustColorOpacity('#36A2EB', 1),
          this.adjustColorOpacity('#FFCE56', 1)
        ],
        borderWidth: 2
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false, // Ensures a consistent size
    cutout: '50%', // Controls the thickness of the ring
    plugins: {
      legend: { display: false }, // Hide legend for cleaner look
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            const datasetLabel = tooltipItem.chart.data.labels[tooltipItem.dataIndex];
            const dataValue = tooltipItem.raw || 0;
            return `${datasetLabel}: ${dataValue}`;
          }
        }
      }
    }
  }
});

  }
  
  adjustColorOpacity(color: string, opacity: number): string {
    const rgba = this.hexToRgb(color);
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${opacity})`;
  }
  
  
  // Converts HEX to RGB
  hexToRgb(hex: string): { r: number; g: number; b: number } {
    let c = hex.substring(1); // Remove #
    if (c.length === 3) {
      c = c.split("").map((char) => char + char).join("");
    }
    const num = parseInt(c, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  
}