import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombinationChartsComponent } from './combination-charts.component';

describe('CombinationChartsComponent', () => {
  let component: CombinationChartsComponent;
  let fixture: ComponentFixture<CombinationChartsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombinationChartsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CombinationChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
