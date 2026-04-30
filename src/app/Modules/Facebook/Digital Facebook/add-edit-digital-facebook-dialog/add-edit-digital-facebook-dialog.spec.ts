import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditDigitalFacebookDialog } from './add-edit-digital-facebook-dialog';

describe('AddEditDigitalFacebookDialog', () => {
  let component: AddEditDigitalFacebookDialog;
  let fixture: ComponentFixture<AddEditDigitalFacebookDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditDigitalFacebookDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditDigitalFacebookDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
