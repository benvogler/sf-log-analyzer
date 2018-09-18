import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../services/session.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

    constructor(private session: SessionService) { }

    ngOnInit() {
    }

    async login(isSandbox = false) {
        await this.session.login(isSandbox);
    }

    async demo() {
        await this.session.demo();
    }

}
