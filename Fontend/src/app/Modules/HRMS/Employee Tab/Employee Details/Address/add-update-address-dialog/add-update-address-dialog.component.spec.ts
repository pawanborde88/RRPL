import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdateAddressDialogComponent } from './add-update-address-dialog.component';

describe('AddUpdateAddressDialogComponent', () => {
  let component: AddUpdateAddressDialogComponent;
  let fixture: ComponentFixture<AddUpdateAddressDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddUpdateAddressDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUpdateAddressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
