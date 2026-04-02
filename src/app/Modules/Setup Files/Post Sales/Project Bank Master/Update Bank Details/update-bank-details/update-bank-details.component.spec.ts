import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateBankDetailsComponent } from './update-bank-details.component';

describe('UpdateBankDetailsComponent', () => {
  let component: UpdateBankDetailsComponent;
  let fixture: ComponentFixture<UpdateBankDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateBankDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdateBankDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
