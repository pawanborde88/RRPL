import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllCPDialogDataComponent } from './all-cpdialog-data.component';

describe('AllCPDialogDataComponent', () => {
  let component: AllCPDialogDataComponent;
  let fixture: ComponentFixture<AllCPDialogDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllCPDialogDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllCPDialogDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
