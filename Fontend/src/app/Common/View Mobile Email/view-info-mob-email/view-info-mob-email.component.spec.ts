import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewInfoMobEmailComponent } from './view-info-mob-email.component';

describe('ViewInfoMobEmailComponent', () => {
  let component: ViewInfoMobEmailComponent;
  let fixture: ComponentFixture<ViewInfoMobEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewInfoMobEmailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewInfoMobEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
