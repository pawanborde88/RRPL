import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StagesPaymentReportComponent } from './stages-payment-report.component';

describe('StagesPaymentReportComponent', () => {
  let component: StagesPaymentReportComponent;
  let fixture: ComponentFixture<StagesPaymentReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StagesPaymentReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StagesPaymentReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
