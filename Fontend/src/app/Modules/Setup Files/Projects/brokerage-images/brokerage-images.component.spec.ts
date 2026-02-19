import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrokerageImagesComponent } from './brokerage-images.component';

describe('BrokerageImagesComponent', () => {
  let component: BrokerageImagesComponent;
  let fixture: ComponentFixture<BrokerageImagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrokerageImagesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BrokerageImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
