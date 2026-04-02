import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllReenquiryReportComponent } from './all-reenquiry-report.component';

describe('AllReenquiryReportComponent', () => {
  let component: AllReenquiryReportComponent;
  let fixture: ComponentFixture<AllReenquiryReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllReenquiryReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllReenquiryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
