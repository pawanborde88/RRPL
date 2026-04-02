import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllDailyDSRReportComponent } from './all-daily-dsrreport.component';

describe('AllDailyDSRReportComponent', () => {
  let component: AllDailyDSRReportComponent;
  let fixture: ComponentFixture<AllDailyDSRReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllDailyDSRReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllDailyDSRReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
