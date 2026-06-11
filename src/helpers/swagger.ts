import { Express } from 'express';
import swaggerUI from 'swagger-ui-express';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerDocs = require('../swagger.json');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerDocsV1 = require('../swagger.v1.json');

export default function (app: Express) {
	// Internal API docs (user / JWT authenticated).
	app.use('/api-docs', swaggerUI.serveFiles(swaggerDocs), swaggerUI.setup(swaggerDocs));

	// External API docs (x-api-key authenticated) - safe to share with integration partners.
	app.use('/api/v1/docs', swaggerUI.serveFiles(swaggerDocsV1), swaggerUI.setup(swaggerDocsV1));
}
