import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QRProjectForomComponent } from './qrproject-forom.component';

describe('QRProjectForomComponent', () => {
  let component: QRProjectForomComponent;
  let fixture: ComponentFixture<QRProjectForomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QRProjectForomComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QRProjectForomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
