import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesreportComponent } from './salesreport.component';

describe('SalesreportComponent', () => {
  let component: SalesreportComponent;
  let fixture: ComponentFixture<SalesreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesreportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SalesreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
