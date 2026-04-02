import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TalecallerSalesexecutiveCountComponent } from './talecaller-salesexecutive-count.component';

describe('TalecallerSalesexecutiveCountComponent', () => {
  let component: TalecallerSalesexecutiveCountComponent;
  let fixture: ComponentFixture<TalecallerSalesexecutiveCountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TalecallerSalesexecutiveCountComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TalecallerSalesexecutiveCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
