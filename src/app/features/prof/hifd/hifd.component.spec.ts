import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HifdComponent } from './hifd.component';

describe('HifdComponent', () => {
  let component: HifdComponent;
  let fixture: ComponentFixture<HifdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HifdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HifdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
