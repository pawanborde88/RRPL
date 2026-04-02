import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllBrokerageComponent } from './all-brokerage.component';

describe('AllBrokerageComponent', () => {
  let component: AllBrokerageComponent;
  let fixture: ComponentFixture<AllBrokerageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllBrokerageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllBrokerageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
