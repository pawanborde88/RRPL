import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddApplicantsComponent } from './add-applicants.component';

describe('AddApplicantsComponent', () => {
  let component: AddApplicantsComponent;
  let fixture: ComponentFixture<AddApplicantsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddApplicantsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddApplicantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
