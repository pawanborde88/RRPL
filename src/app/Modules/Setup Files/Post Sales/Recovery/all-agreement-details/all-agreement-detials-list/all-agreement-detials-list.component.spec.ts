import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllAgreementDetialsListComponent } from './all-agreement-detials-list.component';

describe('AllAgreementDetialsListComponent', () => {
  let component: AllAgreementDetialsListComponent;
  let fixture: ComponentFixture<AllAgreementDetialsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllAgreementDetialsListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllAgreementDetialsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
