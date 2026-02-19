import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TrackByFunction,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { CostomLoadingComponent } from '../coustom Loader/costom-loading/costom-loading.component';

@Component({
  selector: 'app-followups-card-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularMaterialModule,
    ScrollingModule,
    CostomLoadingComponent,
  ],
  templateUrl: './followups-card-view.component.html',
  styleUrl: './followups-card-view.component.scss',
})
export class FollowupsCardViewComponent {
  @Input() mode: 'project' | 'enquiry' = 'project';
  @Input() loading = false;

  @Input() selectedTabIndex = 0;
  @Input() pendingCount = 0;
  @Input() todayCount = 0;
  @Input() upcomingCount = 0;
  @Input() currentTabLabel = '';

  @Input() searchText = '';
  @Output() searchTextChange = new EventEmitter<string>();

  @Input() filteredPendingData: any[] = [];
  @Input() filteredTodayData: any[] = [];
  @Input() filteredUpcomingData: any[] = [];

  @Input() trackByFn: TrackByFunction<any> = (index, item) =>
    item?.id ?? index;

  @Input() showCopyIcons = true;

  @Output() tabChange = new EventEmitter<number>();
  @Output() addFollowUp = new EventEmitter<any>();
  @Output() copyValue = new EventEmitter<string>();

  onTabClick(index: number): void {
    this.tabChange.emit(index);
  }

  onSearchChange(value: string): void {
    this.searchText = value;
    this.searchTextChange.emit(this.searchText);
  }

  onAddFollowUp(item: any): void {
    this.addFollowUp.emit(item);
  }

  onCopy(value: string | null | undefined): void {
    if (!value) {
      return;
    }
    this.copyValue.emit(value);
  }
}


