import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllRoleWiseInsentivesComponent } from './all-role-wise-insentives.component';

describe('AllRoleWiseInsentivesComponent', () => {
  let component: AllRoleWiseInsentivesComponent;
  let fixture: ComponentFixture<AllRoleWiseInsentivesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllRoleWiseInsentivesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllRoleWiseInsentivesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
