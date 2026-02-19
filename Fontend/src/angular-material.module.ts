import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatRippleModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import {MatTabsModule} from '@angular/material/tabs';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatMenuModule} from '@angular/material/menu';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatBadgeModule} from '@angular/material/badge';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatTreeModule} from '@angular/material/tree';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatSelectClearDirective } from './app/Service/common/mat-clear/mat-select-clear-directive.directive';

const materialModules = [
    MatSelectClearDirective,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatChipsModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    MatTableModule,
    MatRippleModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatGridListModule,
    MatSelectModule,
   
    MatSnackBarModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatExpansionModule,
    MatButtonToggleModule,
    MatListModule,

    MatTabsModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatBadgeModule,
    MatToolbarModule,
    MatSidenavModule,
    MatTreeModule,
    MatFormFieldModule,
    MatSliderModule,
    ScrollingModule
    
    

];

@NgModule({
    imports: [
        CommonModule,
        ...materialModules
    ],

    exports: [
        ...materialModules
    ],
    providers: [
        provideNativeDateAdapter(),
        { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { horizontalPosition: 'center', verticalPosition: 'bottom', duration: 5000 } }
    ]

})
export class AngularMaterialModule { }
