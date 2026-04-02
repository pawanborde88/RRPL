import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowupreportComponent } from './followupreport.component';

describe('FollowupreportComponent', () => {
  let component: FollowupreportComponent;
  let fixture: ComponentFixture<FollowupreportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FollowupreportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FollowupreportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
