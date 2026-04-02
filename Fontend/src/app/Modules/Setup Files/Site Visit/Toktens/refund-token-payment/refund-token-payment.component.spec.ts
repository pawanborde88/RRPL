import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundTokenPaymentComponent } from './refund-token-payment.component';

describe('RefundTokenPaymentComponent', () => {
  let component: RefundTokenPaymentComponent;
  let fixture: ComponentFixture<RefundTokenPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundTokenPaymentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RefundTokenPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
