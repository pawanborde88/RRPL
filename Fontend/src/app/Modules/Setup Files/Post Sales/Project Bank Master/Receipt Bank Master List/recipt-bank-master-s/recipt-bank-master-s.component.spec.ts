import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReciptBankMasterSComponent } from './recipt-bank-master-s.component';

describe('ReciptBankMasterSComponent', () => {
  let component: ReciptBankMasterSComponent;
  let fixture: ComponentFixture<ReciptBankMasterSComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReciptBankMasterSComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReciptBankMasterSComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
