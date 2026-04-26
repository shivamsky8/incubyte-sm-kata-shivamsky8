import express from 'express';
import { jsonParser } from './middleware/jsonParser.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp({ db } = {}) {
  const app = express();

  app.use(jsonParser);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Error handler must be last
  app.use(errorHandler);

  return app;
}
