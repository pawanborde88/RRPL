import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscardEnquiryReportComponent } from './discard-enquiry-report.component';

describe('DiscardEnquiryReportComponent', () => {
  let component: DiscardEnquiryReportComponent;
  let fixture: ComponentFixture<DiscardEnquiryReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscardEnquiryReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DiscardEnquiryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
