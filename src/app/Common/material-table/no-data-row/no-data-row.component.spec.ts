import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoDataRowComponent } from './no-data-row.component';

describe('NoDataRowComponent', () => {
  let component: NoDataRowComponent;
  let fixture: ComponentFixture<NoDataRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoDataRowComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoDataRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
