import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseUseRsReport } from './course-use-rs-report';

describe('CourseUseRsReport', () => {
  let component: CourseUseRsReport;
  let fixture: ComponentFixture<CourseUseRsReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseUseRsReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseUseRsReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
