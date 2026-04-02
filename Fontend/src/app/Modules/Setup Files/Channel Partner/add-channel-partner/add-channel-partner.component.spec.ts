import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddChannelPartnerComponent } from './add-channel-partner.component';

describe('AddChannelPartnerComponent', () => {
  let component: AddChannelPartnerComponent;
  let fixture: ComponentFixture<AddChannelPartnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddChannelPartnerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddChannelPartnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
