import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditTagPlaceholders } from './add-edit-tag-placeholders';

describe('AddEditTagPlaceholders', () => {
  let component: AddEditTagPlaceholders;
  let fixture: ComponentFixture<AddEditTagPlaceholders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditTagPlaceholders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditTagPlaceholders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
