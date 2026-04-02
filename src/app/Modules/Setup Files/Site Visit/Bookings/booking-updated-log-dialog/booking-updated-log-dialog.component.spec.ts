import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingUpdatedLogDialogComponent } from './booking-updated-log-dialog.component';

describe('BookingUpdatedLogDialogComponent', () => {
  let component: BookingUpdatedLogDialogComponent;
  let fixture: ComponentFixture<BookingUpdatedLogDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingUpdatedLogDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookingUpdatedLogDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
