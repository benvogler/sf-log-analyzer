import * as express from 'express';

export class UtilService {

    constructor() {}

    respond(res: express.Response, status: number, body?: any) {
        res.status(status);
        res.send(body);
    }
}