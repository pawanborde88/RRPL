import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuatationRequestDialogComponent } from './quatation-request-dialog.component';

describe('QuatationRequestDialogComponent', () => {
  let component: QuatationRequestDialogComponent;
  let fixture: ComponentFixture<QuatationRequestDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuatationRequestDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuatationRequestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
