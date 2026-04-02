import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSourcesComponent } from './add-sources.component';

describe('AddSourcesComponent', () => {
  let component: AddSourcesComponent;
  let fixture: ComponentFixture<AddSourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSourcesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddSourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
