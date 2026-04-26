import { createApp } from './app.js';
import { PORT, DATABASE_PATH } from './config.js';
import Database from 'better-sqlite3';

const db = new Database(DATABASE_PATH);
const app = createApp({ db });

app.listen(PORT, () => {
  console.log(`Salary Management API listening on port ${PORT}`);
});
