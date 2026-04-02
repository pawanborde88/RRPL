import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsDashboardComponent } from './settings-dashboard.component';

describe('SettingsDashboardComponent', () => {
  let component: SettingsDashboardComponent;
  let fixture: ComponentFixture<SettingsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SettingsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
