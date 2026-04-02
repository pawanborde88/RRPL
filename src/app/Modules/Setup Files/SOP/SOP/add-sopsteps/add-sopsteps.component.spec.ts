import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSOPStepsComponent } from './add-sopsteps.component';

describe('AddSOPStepsComponent', () => {
  let component: AddSOPStepsComponent;
  let fixture: ComponentFixture<AddSOPStepsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSOPStepsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddSOPStepsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
