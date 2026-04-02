import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllotUserParkingDialogComponent } from './allot-user-parking-dialog.component';

describe('AllotUserParkingDialogComponent', () => {
  let component: AllotUserParkingDialogComponent;
  let fixture: ComponentFixture<AllotUserParkingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllotUserParkingDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllotUserParkingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
