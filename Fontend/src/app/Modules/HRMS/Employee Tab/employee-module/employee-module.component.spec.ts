import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeModuleComponent } from './employee-module.component';

describe('EmployeeModuleComponent', () => {
  let component: EmployeeModuleComponent;
  let fixture: ComponentFixture<EmployeeModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeModuleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EmployeeModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
