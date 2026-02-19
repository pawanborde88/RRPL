import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsAppintegrationDialogComponent } from './whats-appintegration-dialog.component';

describe('WhatsAppintegrationDialogComponent', () => {
  let component: WhatsAppintegrationDialogComponent;
  let fixture: ComponentFixture<WhatsAppintegrationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsAppintegrationDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WhatsAppintegrationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
