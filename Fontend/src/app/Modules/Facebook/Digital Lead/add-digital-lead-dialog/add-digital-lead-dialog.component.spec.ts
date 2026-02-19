import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDigitalLeadDialogComponent } from './add-digital-lead-dialog.component';

describe('AddDigitalLeadDialogComponent', () => {
  let component: AddDigitalLeadDialogComponent;
  let fixture: ComponentFixture<AddDigitalLeadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDigitalLeadDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddDigitalLeadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
