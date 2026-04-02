import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSpecificationsComponent } from './all-specifications.component';

describe('AllSpecificationsComponent', () => {
  let component: AllSpecificationsComponent;
  let fixture: ComponentFixture<AllSpecificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSpecificationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllSpecificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
