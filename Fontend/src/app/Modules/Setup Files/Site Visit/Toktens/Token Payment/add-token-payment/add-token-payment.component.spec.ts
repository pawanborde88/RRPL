import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTokenPaymentComponent } from './add-token-payment.component';

describe('AddTokenPaymentComponent', () => {
  let component: AddTokenPaymentComponent;
  let fixture: ComponentFixture<AddTokenPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTokenPaymentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddTokenPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
