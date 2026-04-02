import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendWhatsAppTemplageComponent } from './send-whats-app-templage.component';

describe('SendWhatsAppTemplageComponent', () => {
  let component: SendWhatsAppTemplageComponent;
  let fixture: ComponentFixture<SendWhatsAppTemplageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendWhatsAppTemplageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SendWhatsAppTemplageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
