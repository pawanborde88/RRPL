import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBookingVisitorDialogComponent } from './add-booking-visitor-dialog.component';

describe('AddBookingVisitorDialogComponent', () => {
  let component: AddBookingVisitorDialogComponent;
  let fixture: ComponentFixture<AddBookingVisitorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBookingVisitorDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddBookingVisitorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
