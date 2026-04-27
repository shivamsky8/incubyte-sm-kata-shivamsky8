import Database from 'better-sqlite3';

/**
 * Open (or create) a better-sqlite3 database at the given path.
 * Pass ":memory:" for an in-memory database (useful in tests).
 *
 * @param {string} path — file path or ":memory:"
 * @returns {import('better-sqlite3').Database}
 */
export function openDb(path) {
  return new Database(path);
}
