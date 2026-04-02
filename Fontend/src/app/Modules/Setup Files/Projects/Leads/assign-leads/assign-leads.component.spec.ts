import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignLeadsComponent } from './assign-leads.component';

describe('AssignLeadsComponent', () => {
  let component: AssignLeadsComponent;
  let fixture: ComponentFixture<AssignLeadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignLeadsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AssignLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
