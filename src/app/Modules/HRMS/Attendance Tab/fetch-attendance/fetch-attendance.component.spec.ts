import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchAttendanceComponent } from './fetch-attendance.component';

describe('FetchAttendanceComponent', () => {
  let component: FetchAttendanceComponent;
  let fixture: ComponentFixture<FetchAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchAttendanceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FetchAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
