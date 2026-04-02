import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSourcesComponent } from './all-sources.component';

describe('AllSourcesComponent', () => {
  let component: AllSourcesComponent;
  let fixture: ComponentFixture<AllSourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSourcesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllSourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
