import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LandingPageComponent } from './landing-page.component';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

describe('LandingPageComponent', () => {
    let component: LandingPageComponent;
    let fixture: ComponentFixture<LandingPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LandingPageComponent, FormsModule, DecimalPipe]
        })
            .compileComponents();

        fixture = TestBed.createComponent(LandingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
