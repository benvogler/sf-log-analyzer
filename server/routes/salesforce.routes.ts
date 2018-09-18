import { Request, Response, NextFunction } from 'express';
import { SalesforceService } from '../services/salesforce.service';
import { UtilService } from '../services/util.service';

export class SalesforceRoutes {

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
            this.salesforce.setSessionAuthentication(req, userInfo, conn);
            console.log(req.session);
            this.util.respond(res, 200, 'Authenticated successfully');
        } catch (err) {
            console.error('/api/demo error', err);
            this.util.respond(res, 500, 'Internal server error');
        }
    }

    completeLogin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let { userInfo, conn } = await this.salesforce.completeLogin(req.param('code'));
            this.salesforce.setSessionAuthentication(req, userInfo, conn);
            console.log(req.session);
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
}