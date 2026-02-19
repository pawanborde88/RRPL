import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicantDetailsLinkFormComponent } from './applicant-details-link-form.component';

describe('ApplicantDetailsLinkFormComponent', () => {
  let component: ApplicantDetailsLinkFormComponent;
  let fixture: ComponentFixture<ApplicantDetailsLinkFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicantDetailsLinkFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApplicantDetailsLinkFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
