import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreferredlocationComponent } from './preferredlocation.component';

describe('PreferredlocationComponent', () => {
  let component: PreferredlocationComponent;
  let fixture: ComponentFixture<PreferredlocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferredlocationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PreferredlocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
