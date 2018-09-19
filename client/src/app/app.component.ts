import { Component } from '@angular/core';
import { SessionService } from './services/session.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    loading = true;
    showApp = false;

    constructor(private sessionService: SessionService) {
        // Show the login page until there is a valid session
        this.sessionService.session.subscribe(session => session ? this.showApp = true : this.showApp = false);
        // Prevent flickering the login page if there is an existing section
        this.sessionService.loading.subscribe(() => this.loading = false);
    }
}
