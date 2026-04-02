import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostomLoadingComponent } from './costom-loading.component';

describe('CostomLoadingComponent', () => {
  let component: CostomLoadingComponent;
  let fixture: ComponentFixture<CostomLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostomLoadingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CostomLoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
