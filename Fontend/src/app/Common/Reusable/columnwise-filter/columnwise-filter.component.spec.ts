import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnwiseFilterComponent } from './columnwise-filter.component';

describe('ColumnwiseFilterComponent', () => {
  let component: ColumnwiseFilterComponent;
  let fixture: ComponentFixture<ColumnwiseFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnwiseFilterComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ColumnwiseFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
