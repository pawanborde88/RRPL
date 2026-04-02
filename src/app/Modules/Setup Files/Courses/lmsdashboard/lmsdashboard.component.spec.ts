import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LMSDashboardComponent } from './lmsdashboard.component';

describe('LMSDashboardComponent', () => {
  let component: LMSDashboardComponent;
  let fixture: ComponentFixture<LMSDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LMSDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LMSDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
