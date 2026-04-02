import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditEmailTemplateDialog } from './add-edit-email-template-dialog';

describe('AddEditEmailTemplateDialog', () => {
  let component: AddEditEmailTemplateDialog;
  let fixture: ComponentFixture<AddEditEmailTemplateDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditEmailTemplateDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditEmailTemplateDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
