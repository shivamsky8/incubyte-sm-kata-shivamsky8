import { createApp } from './app.js';
import { PORT, DATABASE_PATH } from './config.js';
import { openDb } from './db/connection.js';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Ensure the DB directory exists before opening the connection
mkdirSync(dirname(DATABASE_PATH), { recursive: true });

const db = openDb(DATABASE_PATH);
const app = createApp({ db });

app.listen(PORT, () => {
  console.log(`Salary Management API listening on port ${PORT}`);
});
