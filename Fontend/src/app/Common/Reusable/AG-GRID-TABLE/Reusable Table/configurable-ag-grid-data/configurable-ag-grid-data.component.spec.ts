import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurableAgGridDataComponent } from './configurable-ag-grid-data.component';

describe('ConfigurableAgGridDataComponent', () => {
  let component: ConfigurableAgGridDataComponent;
  let fixture: ComponentFixture<ConfigurableAgGridDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurableAgGridDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfigurableAgGridDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
