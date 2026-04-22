import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnualGoalDashboard } from './annual-goal-dashboard';

describe('AnnualGoalDashboard', () => {
  let component: AnnualGoalDashboard;
  let fixture: ComponentFixture<AnnualGoalDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnualGoalDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnualGoalDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
