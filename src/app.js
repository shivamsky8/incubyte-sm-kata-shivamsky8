import express from 'express';
import { jsonParser } from './middleware/jsonParser.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createSchema } from './db/schema.js';
import { mountRoutes } from './routes/index.js';

export function createApp({ db } = {}) {
  const app = express();

  // Bootstrap DB schema before accepting requests
  if (db) {
    createSchema(db);
  }

  app.use(jsonParser);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount API routes
  if (db) {
    mountRoutes(app, db);
  }

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
