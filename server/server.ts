require('dotenv').config();

import * as express from 'express';
import { json } from 'body-parser';
import { Request, Response, NextFunction } from 'express';
const cookieSession = require('cookie-session');

// Import Services
import { UtilService } from './services/util.service';
import { SalesforceService } from './services/salesforce.service';

// Import Routes
import { SessionRoutes } from './routes/session.routes';
import { SalesforceRoutes } from './routes/salesforce.routes';

const app = express();
app.use(express.static('public'));
app.use(cookieSession({
    name: 'session',
    secret: process.env.SESSION_SECRET,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(json());

// Instantiate Services
const util = new UtilService();
const salesforceService = new SalesforceService();

// Instantiate Routes
const sessionRoutes = new SessionRoutes(util, salesforceService);
const salesforceRoutes = new SalesforceRoutes(util, salesforceService);

// Log requests
app.all('*', (req: Request, res: Response, next: NextFunction) => {
    console.log('Incoming request to', req.path);
    next();
});

// Create Routes
app.get('/', (req: Request, res: Response) => res.sendFile('/public/index.html', {root: './'}));
app.post('/api/demo', sessionRoutes.loginToDemo);
app.post('/api/login', sessionRoutes.login);
app.get('/oauth2/callback', sessionRoutes.completeLogin);
app.get('/api/session', sessionRoutes.nextIfAuthenticated, sessionRoutes.getSession);
app.post('/api/logout', sessionRoutes.nextIfAuthenticated, sessionRoutes.logout);
app.get('/api/sobjects', salesforceRoutes.getAllSObjects);
app.get('/api/sobject/:name', salesforceRoutes.getSObject);
app.post('/api/test/execute', sessionRoutes.nextIfAuthenticated, salesforceRoutes.executeTest);

// Start Server
app.listen(process.env.PORT, () => console.log(`Server online on port ${process.env.PORT}`));
