import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../services/session.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

    showSpinner = false;

    constructor(private session: SessionService) { }

    ngOnInit() {
    }

    async login(isSandbox = false) {
        this.showSpinner = true;
        await this.session.login(isSandbox);
    }

    async demo() {
        this.showSpinner = true;
        await this.session.demo();
        this.showSpinner = false;
    }

}
