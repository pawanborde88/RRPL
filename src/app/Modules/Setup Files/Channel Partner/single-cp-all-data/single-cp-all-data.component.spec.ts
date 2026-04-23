import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleCPAllData } from './single-cpall-data';

describe('SingleCPAllData', () => {
  let component: SingleCPAllData;
  let fixture: ComponentFixture<SingleCPAllData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SingleCPAllData]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SingleCPAllData);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
