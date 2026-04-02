import { Injectable } from '@angular/core';
import { PerformanceBudget } from './reusable-table-refactored.types';

@Injectable()
export class TablePerformanceService {
  private performanceBudget: PerformanceBudget = {
    maxRenderTime: 16, // 60fps target
    maxDataLoadTime: 1000,
    minScrollFPS: 30,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxDomNodes: 10000
  };

  /**
   * Update the performance budget with custom values
   * @param customBudget Partial budget to merge with defaults
   */
  updateBudget(customBudget: Partial<PerformanceBudget>): void {
    this.performanceBudget = {
      ...this.performanceBudget,
      ...customBudget
    };
  }

  /**
   * Get the current performance budget
   */
  getBudget(): PerformanceBudget {
    return { ...this.performanceBudget };
  }

  /**
   * Check if a metric exceeds its budget
   */
  exceedsBudget(metric: keyof PerformanceBudget, value: number): boolean {
    const budgetValue = this.performanceBudget[metric];
    if (budgetValue === undefined) {
      return false;
    }

    // For minScrollFPS, we want value to be >= budget (higher is better)
    if (metric === 'minScrollFPS') {
      return value < budgetValue;
    }

    // For other metrics, we want value to be <= budget (lower is better)
    return value > budgetValue;
  }
}

