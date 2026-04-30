import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailActivityReport } from './detail-activity-report';

describe('DetailActivityReport', () => {
  let component: DetailActivityReport;
  let fixture: ComponentFixture<DetailActivityReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailActivityReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailActivityReport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
