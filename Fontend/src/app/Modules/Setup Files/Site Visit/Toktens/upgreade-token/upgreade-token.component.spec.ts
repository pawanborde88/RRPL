import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgreadeTokenComponent } from './upgreade-token.component';

describe('UpgreadeTokenComponent', () => {
  let component: UpgreadeTokenComponent;
  let fixture: ComponentFixture<UpgreadeTokenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpgreadeTokenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpgreadeTokenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
