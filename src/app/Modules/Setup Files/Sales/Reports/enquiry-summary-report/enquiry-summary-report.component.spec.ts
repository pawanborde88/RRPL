import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnquirySummaryReportComponent } from './enquiry-summary-report.component';

describe('EnquirySummaryReportComponent', () => {
  let component: EnquirySummaryReportComponent;
  let fixture: ComponentFixture<EnquirySummaryReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnquirySummaryReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EnquirySummaryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
