import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllCancelledTokensComponent } from './all-cancelled-tokens.component';

describe('AllCancelledTokensComponent', () => {
  let component: AllCancelledTokensComponent;
  let fixture: ComponentFixture<AllCancelledTokensComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllCancelledTokensComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllCancelledTokensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
