import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParkingTypesDialogComponent } from './parking-types-dialog.component';

describe('ParkingTypesDialogComponent', () => {
  let component: ParkingTypesDialogComponent;
  let fixture: ComponentFixture<ParkingTypesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParkingTypesDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ParkingTypesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
