import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewAgreementComponent } from './add-new-agreement.component';

describe('AddNewAgreementComponent', () => {
  let component: AddNewAgreementComponent;
  let fixture: ComponentFixture<AddNewAgreementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewAgreementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddNewAgreementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
