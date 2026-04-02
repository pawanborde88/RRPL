import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewParkingDialogComponent } from './add-new-parking-dialog.component';

describe('AddNewParkingDialogComponent', () => {
  let component: AddNewParkingDialogComponent;
  let fixture: ComponentFixture<AddNewParkingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewParkingDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddNewParkingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
