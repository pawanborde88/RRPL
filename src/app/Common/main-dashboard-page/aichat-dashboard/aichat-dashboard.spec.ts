import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AIChatDashboard } from './aichat-dashboard';

describe('AIChatDashboard', () => {
  let component: AIChatDashboard;
  let fixture: ComponentFixture<AIChatDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AIChatDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AIChatDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
