import { Injectable, ElementRef } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js';

/**
 * Chart Service
 * Centralized chart creation and management
 */
@Injectable()
export class ChartService {
  private readonly charts = new Map<string, Chart>();

  /**
   * Apply global chart theme
   */
  applyTheme(): void {
    const isMobile = window.innerWidth < 768;

    // Global Defaults
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.font.size = isMobile ? 11 : 13;
    Chart.defaults.color = '#64748b'; // slate-500
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;

    // Smooth Animations
    Chart.defaults.animation = {
      duration: 1200,
      easing: 'easeOutQuart'
    } as any;

    // Grid Scaling
    Chart.defaults.scale.grid.color = '#f1f5f9'; // slate-100
    Chart.defaults.scale.grid.tickLength = 0;
    (Chart.defaults.scale as any).border = { display: false };
    Chart.defaults.scale.ticks.padding = 10;
    Chart.defaults.scale.ticks.font = {
      size: 11,
      weight: '500'
    };

    // Tooltips (Premium Dark Style)
    if (!Chart.defaults.plugins) Chart.defaults.plugins = {} as any;
    Chart.defaults.plugins.tooltip = {
      backgroundColor: '#0f172a', // slate-900
      titleFont: {
        family: "'Outfit', sans-serif",
        size: 13,
        weight: '700'
      },
      bodyFont: {
        family: "'Outfit', sans-serif",
        size: 12,
        weight: '500'
      },
      padding: 12,
      cornerRadius: 12,
      usePointStyle: true,
      boxPadding: 8,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      caretSize: 6,
      displayColors: true,
      callbacks: {
        labelColor: function (context: any) {
          return {
            borderColor: 'transparent',
            backgroundColor: context.dataset.backgroundColor[context.dataIndex] || context.dataset.backgroundColor,
            borderWidth: 0,
            borderRadius: 4,
          };
        }
      }
    } as any;

    // Legend
    Chart.defaults.plugins.legend = {
      display: false, // We use custom HTML legends mostly
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 25,
        boxWidth: 8,
        font: {
          family: "'Outfit', sans-serif",
          size: 12,
          weight: '600'
        },
        color: '#475569' // slate-600
      }
    } as any;
  }

  /**
   * Create or update a chart
   */
  createChart(
    key: string,
    canvasRef: ElementRef<HTMLCanvasElement> | null,
    config: ChartConfiguration
  ): Chart | null {
    if (!canvasRef?.nativeElement) {
      return null;
    }

    // Destroy existing chart if present
    this.destroyChart(key);

    const ctx = canvasRef.nativeElement.getContext('2d');
    if (!ctx) {
      return null;
    }

    const chart = new Chart(ctx, config);
    this.charts.set(key, chart);
    return chart;
  }

  /**
   * Update chart data
   */
  updateChart(key: string, updater: (chart: Chart) => void, animation: boolean = true): void {
    const chart = this.charts.get(key);
    if (chart) {
      updater(chart);
      chart.update(animation ? 'active' : 'none');
    }
  }

  /**
   * Destroy a specific chart
   */
  destroyChart(key: string): void {
    const chart = this.charts.get(key);
    if (chart) {
      chart.destroy();
      this.charts.delete(key);
    }
  }

  /**
   * Destroy all charts
   */
  destroyAll(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts.clear();
  }

  /**
   * Get chart instance
   */
  getChart(key: string): Chart | undefined {
    return this.charts.get(key);
  }
}
