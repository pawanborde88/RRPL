export interface StrategyItem {
  strategy_id: number;
  strategy_name: string;
  department_id: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentStrategiesGroup {
  department_name: string;
  strategies: StrategyItem[];
}
