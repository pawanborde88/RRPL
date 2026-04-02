import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllRevisitEnquiryReportComponent } from './all-revisit-enquiry-report.component';

describe('AllRevisitEnquiryReportComponent', () => {
  let component: AllRevisitEnquiryReportComponent;
  let fixture: ComponentFixture<AllRevisitEnquiryReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllRevisitEnquiryReportComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AllRevisitEnquiryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
