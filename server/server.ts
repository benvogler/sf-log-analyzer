require('dotenv').config();

import * as express from 'express';

// Import Services
import { UtilService } from './services/util-service';
import { SalesforceService } from './services/salesforce-service';

// Import Routes
import { SalesforceRoutes } from './routes/salesforce-routes';

const app = express();
app.use(express.static('public'));

// Instanciate Services
const util = new UtilService();
const salesforceService = new SalesforceService();

// Instanciate Routes
const salesforceRoutes = new SalesforceRoutes(util, salesforceService);

// Create Routes
app.get('/', (req: express.Request, res: express.Response) => res.sendFile('/public/index.html', {root: './'}));
app.get('/api/test', salesforceRoutes.handleTest);

// Start Server
app.listen(process.env.PORT, () => console.log(`Server online on port ${process.env.PORT}`));