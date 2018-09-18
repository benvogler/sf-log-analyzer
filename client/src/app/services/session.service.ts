import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SessionService {

    session = this.getSession();
    loading = new ReplaySubject<void>();

    constructor(private http: HttpClient) {}

    private getSession(): ReplaySubject<any> {
        let subject = new ReplaySubject<any>();
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
        const { url } = await this.http.post<any>('/api/login', {isSandbox: isSandbox}).toPromise();
        window.location.replace(url);
    }

    async demo() {
        try {
            const session = await this.http.post<any>('/api/demo', {}).toPromise();
            this.session.next(session);
        } catch (err) {
            console.log('demo error', err);
        }
    }

    async logout() {
        await this.http.post<any>('/api/logout', {});
        this.session.next(undefined);
    }
}
