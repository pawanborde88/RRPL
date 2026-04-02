import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllIVRUsersComponent } from './all-ivrusers.component';

describe('AllIVRUsersComponent', () => {
  let component: AllIVRUsersComponent;
  let fixture: ComponentFixture<AllIVRUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllIVRUsersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllIVRUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
