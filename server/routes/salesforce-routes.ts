import * as express from 'express';
import { SalesforceService } from '../services/salesforce-service';
import { UtilService } from '../services/util-service';

export class SalesforceRoutes {

    constructor(private util: UtilService, private salesforce: SalesforceService) {}

    handleTest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        this.salesforce.handleTest();
        this.util.respond(res, 200, 'Success');
    }
}