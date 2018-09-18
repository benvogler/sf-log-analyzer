import { Request, Response, NextFunction } from 'express';
import { SalesforceService } from '../services/salesforce.service';
import { UtilService } from '../services/util.service';

export class SessionRoutes {

    constructor(private util: UtilService, private salesforce: SalesforceService) {}

    login = (req: Request, res: Response, next: NextFunction) => {
        try {
            this.util.respond(res, 200, {
                url: this.salesforce.getAuthorizationUrl(
                    req.body.isSandbox,
                    `${req.protocol}://${req.hostname}/oauth2/callback`
                )
            });
        } catch (err) {
            console.error('/api/login error', err);
            this.util.respond(res, 500, 'Internal server error');
        }
    }

    loginToDemo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let { userInfo, conn } = await this.salesforce.loginToDemo();
            await this.salesforce.setSessionAuthentication(req, userInfo, conn);
            this.util.respond(res, 200, this.salesforce.getSanitizedSession(req));
        } catch (err) {
            console.error('/api/demo error', err);
            this.util.respond(res, 500, 'Internal server error');
        }
    }

    completeLogin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let { userInfo, conn } = await this.salesforce.completeLogin(req.param('code'));
            await this.salesforce.setSessionAuthentication(req, userInfo, conn);
            res.redirect(`${req.protocol}://${req.hostname}:${process.env.ENVIRONMENT !== 'local' ? process.env.PORT : 4200}`);
        } catch (err) {
            console.error('/oauth2/callback error', err);
            this.util.respond(res, 500, 'Internal server error');
        }
    }

    nextIfAuthenticated = (req: Request, res: Response, next: NextFunction) => {
        if (req.session && req.session.authentication && req.session.authentication.accessToken) next();
        else this.util.respond(res, 401, 'You must log in through Salesforce first');
    }

    getSession = (req: Request, res: Response, next: NextFunction) => {
        this.util.respond(res, 200, this.salesforce.getSanitizedSession(req));
    }

    logout = (req: Request, res: Response, next: NextFunction) => {
        req.session = null;
        this.util.respond(res, 200);
    }
}