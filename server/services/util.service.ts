import * as express from 'express';

export class UtilService {

    constructor() {}

    respond(res: express.Response, status: number, body?: any) {
        res.status(status);
        if (typeof body === 'string') body = {message: body};
        res.send(body);
    }
}