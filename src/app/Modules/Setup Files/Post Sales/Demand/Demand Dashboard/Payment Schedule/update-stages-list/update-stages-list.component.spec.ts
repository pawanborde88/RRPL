import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateStagesListComponent } from './update-stages-list.component';

describe('UpdateStagesListComponent', () => {
  let component: UpdateStagesListComponent;
  let fixture: ComponentFixture<UpdateStagesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateStagesListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdateStagesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
