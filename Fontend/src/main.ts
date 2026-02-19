import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Register AG Grid modules globally (includes ClientSideRowModelModule and all other community modules)
ModuleRegistry.registerModules([AllCommunityModule]);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
  




