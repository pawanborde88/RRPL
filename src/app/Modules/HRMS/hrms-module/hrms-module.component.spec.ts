import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrmsModuleComponent } from './hrms-module.component';

describe('HrmsModuleComponent', () => {
  let component: HrmsModuleComponent;
  let fixture: ComponentFixture<HrmsModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrmsModuleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HrmsModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
