import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { ModuleRegistry as ChartModuleRegistry, AllCommunityModule as AllChartCommunityModule } from 'ag-charts-community';

// Register AG Grid modules globally
ModuleRegistry.registerModules([AllCommunityModule]);

// Register AG Charts modules globally
ChartModuleRegistry.registerModules([AllChartCommunityModule]);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));





