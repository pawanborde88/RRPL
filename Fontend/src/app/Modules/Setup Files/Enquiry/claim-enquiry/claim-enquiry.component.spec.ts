import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaimEnquiryComponent } from './claim-enquiry.component';

describe('ClaimEnquiryComponent', () => {
  let component: ClaimEnquiryComponent;
  let fixture: ComponentFixture<ClaimEnquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimEnquiryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClaimEnquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
