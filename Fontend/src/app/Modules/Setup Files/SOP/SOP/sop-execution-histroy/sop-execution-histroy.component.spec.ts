import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SopExecutionHistroyComponent } from './sop-execution-histroy.component';

describe('SopExecutionHistroyComponent', () => {
  let component: SopExecutionHistroyComponent;
  let fixture: ComponentFixture<SopExecutionHistroyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SopExecutionHistroyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SopExecutionHistroyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
