import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditSOPStepsComponent } from './add-edit-sopsteps.component';

describe('AddEditSOPStepsComponent', () => {
  let component: AddEditSOPStepsComponent;
  let fixture: ComponentFixture<AddEditSOPStepsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditSOPStepsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditSOPStepsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
