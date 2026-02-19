import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSOPDetailsComponent } from './all-sopdetails.component';

describe('AllSOPDetailsComponent', () => {
  let component: AllSOPDetailsComponent;
  let fixture: ComponentFixture<AllSOPDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSOPDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllSOPDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
