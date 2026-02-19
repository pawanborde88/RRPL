import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllCPPayoutComponent } from './all-cppayout.component';

describe('AllCPPayoutComponent', () => {
  let component: AllCPPayoutComponent;
  let fixture: ComponentFixture<AllCPPayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllCPPayoutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllCPPayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
