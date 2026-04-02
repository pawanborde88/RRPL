import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCPBillPaymentDialogComponent } from './add-cpbill-payment-dialog.component';

describe('AddCPBillPaymentDialogComponent', () => {
  let component: AddCPBillPaymentDialogComponent;
  let fixture: ComponentFixture<AddCPBillPaymentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCPBillPaymentDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCPBillPaymentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
