import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class SessionService {

    constructor(private http: HttpClient) { }

    async login(isSandbox = false) {
        console.log('body', {isSandbox: isSandbox});
        const { url } = await this.http.post<any>('/api/login', {isSandbox: isSandbox}).toPromise();
        window.location.replace(url);
    }

    async demo() {
        try {
            const res = await this.http.post<any>('/api/demo', {}).toPromise();
            console.log('Logged into demo user successfully');
        } catch (err) {
            console.log('demo error', err);
        }
    }
}
