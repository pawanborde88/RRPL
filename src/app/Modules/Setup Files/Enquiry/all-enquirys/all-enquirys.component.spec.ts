import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllEnquirysComponent } from './all-enquirys.component';

describe('AllEnquirysComponent', () => {
  let component: AllEnquirysComponent;
  let fixture: ComponentFixture<AllEnquirysComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllEnquirysComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllEnquirysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
