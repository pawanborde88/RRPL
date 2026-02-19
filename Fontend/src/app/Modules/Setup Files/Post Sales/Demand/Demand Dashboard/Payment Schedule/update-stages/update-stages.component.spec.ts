import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateStagesComponent } from './update-stages.component';

describe('UpdateStagesComponent', () => {
  let component: UpdateStagesComponent;
  let fixture: ComponentFixture<UpdateStagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateStagesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdateStagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
