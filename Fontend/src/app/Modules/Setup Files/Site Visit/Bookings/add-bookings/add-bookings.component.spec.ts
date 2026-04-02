import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBookingsComponent } from './add-bookings.component';

describe('AddBookingsComponent', () => {
  let component: AddBookingsComponent;
  let fixture: ComponentFixture<AddBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBookingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
