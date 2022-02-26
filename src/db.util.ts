import { Database } from "sqlite3";

class DatabaseQuery {
  database: Database;
  constructor(database: Database) {
    this.database = database;
  }

  queryAll<T>(sqlQuery: string, params?: string[]): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      this.database.all(
        sqlQuery,
        params ?? [],
        (err: Error | null, res: T[]) => {
          if (err !== null) {
            reject(err.message);
          }
          resolve(res);
        }
      );
    });
  }

  run(sqlQuery: string, params?: string[]): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.database.run(sqlQuery, params, function (err: Error | null) {
        if (err !== null) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    });
  }

  get<T>(sqlQuery: string, params?: string[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.database.get(sqlQuery, params ?? [], (err: Error | null, res: T) => {
        if (err !== null) {
          reject(err.message);
        }
        resolve(res);
      });
    });
  }
}
export default DatabaseQuery;
