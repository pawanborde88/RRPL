import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditIVRUserComponent } from './add-edit-ivruser.component';

describe('AddEditIVRUserComponent', () => {
  let component: AddEditIVRUserComponent;
  let fixture: ComponentFixture<AddEditIVRUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditIVRUserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditIVRUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
