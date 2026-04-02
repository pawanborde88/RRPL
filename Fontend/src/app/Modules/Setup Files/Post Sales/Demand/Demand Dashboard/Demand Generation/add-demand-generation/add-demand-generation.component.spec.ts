import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDemandGenerationComponent } from './add-demand-generation.component';

describe('AddDemandGenerationComponent', () => {
  let component: AddDemandGenerationComponent;
  let fixture: ComponentFixture<AddDemandGenerationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddDemandGenerationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddDemandGenerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
