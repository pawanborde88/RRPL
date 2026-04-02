import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllProjectBankMasterComponent } from './all-project-bank-master.component';

describe('AllProjectBankMasterComponent', () => {
  let component: AllProjectBankMasterComponent;
  let fixture: ComponentFixture<AllProjectBankMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllProjectBankMasterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllProjectBankMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
