import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFollowUpDialog } from './add-follow-up-dialog';

describe('AddFollowUpDialog', () => {
  let component: AddFollowUpDialog;
  let fixture: ComponentFixture<AddFollowUpDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFollowUpDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFollowUpDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
