import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JavaApiComponent } from './java-api.component';

describe('JavaApiComponent', () => {
  let component: JavaApiComponent;
  let fixture: ComponentFixture<JavaApiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JavaApiComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JavaApiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
