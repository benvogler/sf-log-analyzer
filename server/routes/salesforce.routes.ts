import { Request, Response, NextFunction } from 'express';
import { SalesforceService } from '../services/salesforce.service';
import { UtilService } from '../services/util.service';

export class SalesforceRoutes {

    constructor(private util: UtilService, private salesforce: SalesforceService) {}

    getAllSObjects = async (req: Request, res: Response, next: NextFunction) => {
        try {
            this.util.respond(res, 200, await this.salesforce.getAllSObjects(req.session));
        } catch(err) {
            console.error('/api/sobjects error', err);
            this.util.respond(res, 500, 'Failed to retrieve SObjects');
        }
    }

    getSObject = async (req: Request, res: Response, next: NextFunction) => {
        if (!req.params.name) {
            this.util.respond(res, 400, 'Missing parameter: "name"');
            return;
        }
        try {
            this.util.respond(res, 200, await this.salesforce.getSObject(req.session, req.params.name));
        } catch(err) {
            console.error('/api/sobject error', err);
            this.util.respond(res, 500, 'Failed to retrieve SObject');
        }
    }

    executeTest = async (req: Request, res: Response, next: NextFunction) => {
        console.log('received request', req.body);
        const steps = req.body;
        for (let step of steps) {
            step.variable = step.variableName;
            delete step.variableName;
            step.datatype = step.selectedSObject.id;
            delete step.selectedSObject;
            step.fields = [];
            step.values = [];
            for (let condition of step.conditions) {
                step.fields.push(condition.field.selectedOption.id);
                step.values.push(condition.value);
            }
            step.type = step.type.id;
            delete step.conditions;
        }
        console.log(steps);
        let body = await this.salesforce.executeDynamicTest(req.session, steps);
        console.log('got response', body);
        this.util.respond(res, 200, body);
    }

}