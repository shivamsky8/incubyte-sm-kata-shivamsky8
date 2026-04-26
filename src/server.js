import { createApp } from './app.js';
import { PORT, DATABASE_PATH } from './config.js';
import { openDb } from './db/connection.js';

const db = openDb(DATABASE_PATH);
const app = createApp({ db });

app.listen(PORT, () => {
  console.log(`Salary Management API listening on port ${PORT}`);
});
