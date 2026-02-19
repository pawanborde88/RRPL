import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedSearchFilterDialogComponent } from './advanced-search-filter-dialog.component';

describe('AdvancedSearchFilterDialogComponent', () => {
  let component: AdvancedSearchFilterDialogComponent;
  let fixture: ComponentFixture<AdvancedSearchFilterDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedSearchFilterDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdvancedSearchFilterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
