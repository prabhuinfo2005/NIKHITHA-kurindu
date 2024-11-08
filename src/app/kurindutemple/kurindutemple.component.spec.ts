import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KurindutempleComponent } from './kurindutemple.component';

describe('KurindutempleComponent', () => {
  let component: KurindutempleComponent;
  let fixture: ComponentFixture<KurindutempleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KurindutempleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KurindutempleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
