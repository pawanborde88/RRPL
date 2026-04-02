import { Component } from '@angular/core';
import { TemplateComponent } from "../../../Common/template/template.component";
import { PieChartsComponent } from "./pie-charts/pie-charts.component";
import { BreadcrumbComponent } from "../../../Common/breadcrumb/breadcrumb.component";
import { CombinationChartsComponent } from "./combination-charts/combination-charts.component";
import { DonutChartComponent } from "./donut-chart/donut-chart.component";

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [TemplateComponent, PieChartsComponent, BreadcrumbComponent, CombinationChartsComponent, DonutChartComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})
export class SalesComponent {

}
