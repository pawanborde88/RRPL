import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsolidatedCollectionReportComponent } from './consolidated-collection-report.component';

describe('ConsolidatedCollectionReportComponent', () => {
  let component: ConsolidatedCollectionReportComponent;
  let fixture: ComponentFixture<ConsolidatedCollectionReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsolidatedCollectionReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConsolidatedCollectionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
