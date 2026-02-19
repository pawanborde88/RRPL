import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchLeavesComponent } from './fetch-leaves.component';

describe('FetchLeavesComponent', () => {
  let component: FetchLeavesComponent;
  let fixture: ComponentFixture<FetchLeavesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchLeavesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FetchLeavesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
