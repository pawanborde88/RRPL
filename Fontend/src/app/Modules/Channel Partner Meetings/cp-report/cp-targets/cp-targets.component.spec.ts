import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpTargetsComponent } from './cp-targets.component';

describe('CpTargetsComponent', () => {
  let component: CpTargetsComponent;
  let fixture: ComponentFixture<CpTargetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpTargetsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CpTargetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
