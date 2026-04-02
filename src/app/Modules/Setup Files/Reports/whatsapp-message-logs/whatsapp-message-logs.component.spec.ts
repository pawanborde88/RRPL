import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsappMessageLogsComponent } from './whatsapp-message-logs.component';

describe('WhatsappMessageLogsComponent', () => {
  let component: WhatsappMessageLogsComponent;
  let fixture: ComponentFixture<WhatsappMessageLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsappMessageLogsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WhatsappMessageLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
