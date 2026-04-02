import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokerageOfferComponent } from './brokerage-offer.component';

describe('BrokerageOfferComponent', () => {
  let component: BrokerageOfferComponent;
  let fixture: ComponentFixture<BrokerageOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrokerageOfferComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BrokerageOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
