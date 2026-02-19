import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllChannelPartnerComponent } from './all-channel-partner.component';

describe('AllChannelPartnerComponent', () => {
  let component: AllChannelPartnerComponent;
  let fixture: ComponentFixture<AllChannelPartnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllChannelPartnerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllChannelPartnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
