import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesEnquiryTransferReportComponent } from './sales-enquiry-transfer-report.component';

describe('SalesEnquiryTransferReportComponent', () => {
  let component: SalesEnquiryTransferReportComponent;
  let fixture: ComponentFixture<SalesEnquiryTransferReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesEnquiryTransferReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalesEnquiryTransferReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
