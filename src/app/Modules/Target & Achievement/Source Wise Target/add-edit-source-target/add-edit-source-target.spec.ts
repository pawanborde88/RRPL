import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditSourceTarget } from './add-edit-source-target';

describe('AddEditSourceTarget', () => {
  let component: AddEditSourceTarget;
  let fixture: ComponentFixture<AddEditSourceTarget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditSourceTarget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditSourceTarget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
