import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config/config';
import logger from './middleware/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import routes from './routes';

const app: Application = express();

app.use(helmet());

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

app.use(compression());

app.use(logger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(`/api/${config.apiVersion}`, routes);

app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.use(notFound);
app.use(errorHandler);

export default app;
