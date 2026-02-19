import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutiveProjectQRComponent } from './executive-project-qr.component';

describe('ExecutiveProjectQRComponent', () => {
  let component: ExecutiveProjectQRComponent;
  let fixture: ComponentFixture<ExecutiveProjectQRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExecutiveProjectQRComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExecutiveProjectQRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
