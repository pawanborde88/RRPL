import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllWhatsappMessageLogComponent } from './all-whatsapp-message-log.component';

describe('AllWhatsappMessageLogComponent', () => {
  let component: AllWhatsappMessageLogComponent;
  let fixture: ComponentFixture<AllWhatsappMessageLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllWhatsappMessageLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllWhatsappMessageLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
