import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllmonthlyTargets } from './allmonthly-targets';

describe('AllmonthlyTargets', () => {
  let component: AllmonthlyTargets;
  let fixture: ComponentFixture<AllmonthlyTargets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllmonthlyTargets]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllmonthlyTargets);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
