import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditFamilyDetailsDialogComponent } from './add-edit-family-details-dialog.component';

describe('AddEditFamilyDetailsDialogComponent', () => {
  let component: AddEditFamilyDetailsDialogComponent;
  let fixture: ComponentFixture<AddEditFamilyDetailsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditFamilyDetailsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditFamilyDetailsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
