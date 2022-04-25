import 'module-alias/register';
import express from 'express';
import cors from 'cors';

// import storage from "helpers/storage";
import headers from 'middleware/headers';
import errorHandler from 'middleware/errorHandler';
import connection from 'helpers/connection';

import routing from 'routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// storage(app);
app.use(headers);
routing(app);
app.use(errorHandler);

connection(app);
