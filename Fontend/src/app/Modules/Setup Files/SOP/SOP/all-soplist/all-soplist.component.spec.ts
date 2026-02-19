import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSOPListComponent } from './all-soplist.component';

describe('AllSOPListComponent', () => {
  let component: AllSOPListComponent;
  let fixture: ComponentFixture<AllSOPListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSOPListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllSOPListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
