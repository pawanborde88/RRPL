import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllCPBookingListComponent } from './all-cpbooking-list.component';

describe('AllCPBookingListComponent', () => {
  let component: AllCPBookingListComponent;
  let fixture: ComponentFixture<AllCPBookingListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllCPBookingListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllCPBookingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
