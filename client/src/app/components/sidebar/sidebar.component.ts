import { Component, OnInit } from '@angular/core';
import { SessionService } from '../../services/session.service';
import { ReplaySubject } from 'rxjs';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

    session: ReplaySubject<any>;

    constructor(private sessionService: SessionService) {
        this.session = this.sessionService.session;
        this.session.subscribe(session => console.log('session', session));
    }

    ngOnInit() {
    }

}
