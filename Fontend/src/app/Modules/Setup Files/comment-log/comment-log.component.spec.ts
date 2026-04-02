import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentLogComponent } from './comment-log.component';

describe('CommentLogComponent', () => {
  let component: CommentLogComponent;
  let fixture: ComponentFixture<CommentLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommentLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
