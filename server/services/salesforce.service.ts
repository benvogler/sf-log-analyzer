import { Request } from 'express';
import * as jsforce from 'jsforce';

export class SalesforceService {

    oauth2 = new jsforce.OAuth2({
        clientId: process.env.SF_CONSUMER_KEY,
        clientSecret: process.env.SF_CONSUMER_SECRET
    });

    constructor() {
        if (!process.env.SF_CONSUMER_KEY || !process.env.SF_CONSUMER_SECRET) {
            throw 'Error: Missing Salesforce Connected App Credentials';
        }
        if (!process.env.DEMO_USER || !process.env.DEMO_USER_PASSWORD || !process.env.DEMO_USER_SECURITY_TOKEN) {
            throw 'Error: Missing Salesforce Demo User Credentials';
        }
    }

    getAuthorizationUrl(isSandbox: boolean, redirectUri: string) {
        this.oauth2.redirectUri = redirectUri;
        this.oauth2.loginUrl = `https://${isSandbox ? 'test' : 'login'}.salesforce.com/`;
        return this.oauth2.getAuthorizationUrl({}).replace('login', isSandbox ? 'test' : 'login');
    }

    async completeLogin(code: string): Promise<{userInfo: jsforce.UserInfo, conn: jsforce.Connection}> {
        const conn = new jsforce.Connection({oauth2: this.oauth2});
        let userInfo = await conn.authorize(code);
        return {userInfo: userInfo, conn: conn};
    }

    async loginToDemo(): Promise<{userInfo: jsforce.UserInfo, conn: jsforce.Connection}> {
        const conn = new jsforce.Connection({loginUrl: 'https://login.salesforce.com/'});
        let userInfo = await conn.login(process.env.DEMO_USER, process.env.DEMO_USER_PASSWORD + process.env.DEMO_USER_SECURITY_TOKEN);
        return {userInfo: userInfo, conn: conn};
    }

    setSessionAuthentication(req: Request, userInfo: jsforce.UserInfo, conn: jsforce.Connection) {
        req.session = {
            authentication: {
                accessToken: conn.accessToken,
                refreshToken: (conn as any).refreshToken, // Missing type in @types/jsforce
                instanceUrl: conn.instanceUrl,
                userId: userInfo.id,
                organizationId: userInfo.organizationId
            }
        }
    }
}