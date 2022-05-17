import { Express } from 'express';
import swaggerUI from 'swagger-ui-express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerDocs = require('../swagger.json');

export default function (app: Express) {
	app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
}
