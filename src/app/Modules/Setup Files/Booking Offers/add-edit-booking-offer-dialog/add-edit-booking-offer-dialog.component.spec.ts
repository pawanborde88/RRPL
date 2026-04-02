import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditBookingOfferDialogComponent } from './add-edit-booking-offer-dialog.component';

describe('AddEditBookingOfferDialogComponent', () => {
  let component: AddEditBookingOfferDialogComponent;
  let fixture: ComponentFixture<AddEditBookingOfferDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditBookingOfferDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditBookingOfferDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
