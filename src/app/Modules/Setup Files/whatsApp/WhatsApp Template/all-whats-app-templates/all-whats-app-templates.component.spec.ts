import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllWhatsAppTemplatesComponent } from './all-whats-app-templates.component';

describe('AllWhatsAppTemplatesComponent', () => {
  let component: AllWhatsAppTemplatesComponent;
  let fixture: ComponentFixture<AllWhatsAppTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllWhatsAppTemplatesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllWhatsAppTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
