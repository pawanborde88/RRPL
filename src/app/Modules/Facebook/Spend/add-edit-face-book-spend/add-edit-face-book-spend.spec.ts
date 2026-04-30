import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditFaceBookSpend } from './add-edit-face-book-spend';

describe('AddEditFaceBookSpend', () => {
  let component: AddEditFaceBookSpend;
  let fixture: ComponentFixture<AddEditFaceBookSpend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditFaceBookSpend]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditFaceBookSpend);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
