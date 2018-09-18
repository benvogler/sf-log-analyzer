import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SessionService {

    session = this.getSession();
    loading = new Subject<void>();

    constructor(private http: HttpClient) {}

    private getSession(): Subject<any> {
        let subject = new Subject<any>();
        this.http.get<any>('/api/session').subscribe(session => {
            // Send the subject to observers
            subject.next(session);
            // Alert observers that the initial session loading is over
            this.loading.next();
        }, error => {
            // A 401 error indicates that there is no pre-existing session, however loading is complete still
            this.loading.next();
        });
        return subject;
    }

    async login(isSandbox = false) {
        console.log('body', {isSandbox: isSandbox});
        const { url } = await this.http.post<any>('/api/login', {isSandbox: isSandbox}).toPromise();
        window.location.replace(url);
    }

    async demo() {
        try {
            const session = await this.http.post<any>('/api/demo', {}).toPromise();
            console.log('Logged into demo user successfully');
            this.session.next(session);
        } catch (err) {
            console.log('demo error', err);
        }
    }
}
