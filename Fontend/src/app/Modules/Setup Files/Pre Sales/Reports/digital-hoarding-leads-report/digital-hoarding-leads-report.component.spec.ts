import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalHoardingLeadsReportComponent } from './digital-hoarding-leads-report.component';

describe('DigitalHoardingLeadsReportComponent', () => {
  let component: DigitalHoardingLeadsReportComponent;
  let fixture: ComponentFixture<DigitalHoardingLeadsReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalHoardingLeadsReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DigitalHoardingLeadsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
