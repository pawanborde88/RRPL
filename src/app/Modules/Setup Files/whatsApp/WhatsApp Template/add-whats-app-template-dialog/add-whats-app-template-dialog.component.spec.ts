import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddWhatsAppTemplateDialogComponent } from './add-whats-app-template-dialog.component';

describe('AddWhatsAppTemplateDialogComponent', () => {
  let component: AddWhatsAppTemplateDialogComponent;
  let fixture: ComponentFixture<AddWhatsAppTemplateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddWhatsAppTemplateDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddWhatsAppTemplateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
