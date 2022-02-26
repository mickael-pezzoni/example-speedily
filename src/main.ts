import { Server, NotFoundError, Controller, Params, Body } from "speedily-js";
import { Database } from "sqlite3";
import DatabaseQuery from "./db.util";

interface Product {
  id: number;
  name: string;
  type: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

(async () => {
  const db = await initDatabase();
  const server = new Server(3000);
  const databaseQuery = new DatabaseQuery(db);
  databaseQuery.run(`CREATE TABLE IF NOT EXISTS products (
    id integer PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
    name varchar(100),
    description varchar(255),
    type varchar(50),
    created_at datetime,
    updated_at datetime
  );`);
  const getProducts = _getProducts.bind(databaseQuery);
  const getProduct = _getProduct.bind(databaseQuery);
  const newProduct = _newProduct.bind(databaseQuery);
  const updateProduct = _updateProduct.bind(databaseQuery);
  const deletePRoduct = _deleteProduct.bind(databaseQuery);

  const productController = new Controller("/products")
    .get("/", () => getProducts())
    .get("/:id", (param) => getProduct(+param.id))
    .post("/", (_param, body) => newProduct(body as Product))
    .put("/:id", (param, body) => updateProduct(+param.id, body as Product))
    .delete("/:id", (param) => deletePRoduct(+param.id));

  server.setControllers([productController]);

  server.run();
})();

function initDatabase(): Promise<Database> {
  return new Promise<Database>((resolve, reject) => {
    const db = new Database("./database.sqlite3", (err: Error | null) => {
      if (err !== null) {
        reject(err);
      }
      resolve(db);
    });
  });
}
function _getProducts(this: DatabaseQuery): Promise<Product[]> {
  return this.queryAll<Product>(`SELECT * FROM PRODUCTS`);
}

async function _getProduct(this: DatabaseQuery, id: number): Promise<Product> {
  const result = await this.get<Product>(
    `SELECT * FROM PRODUCTS WHERE id = ?`,
    [id.toString()]
  ).catch(() => undefined);

  if (result === undefined) {
    throw new NotFoundError(`Product #${id} not found`);
  }

  return result;
}

async function _newProduct(
  this: DatabaseQuery,
  body: Product
): Promise<string> {
  const insertId = await this.run(
    "INSERT INTO products (name, description, type, created_at, updated_at) VALUES(?, ?, ?, ?, ?)",
    [
      body.name,
      body.description,
      body.type,
      new Date().toISOString(),
      new Date().toISOString(),
    ]
  );

  return `Product #${insertId} created`;
}

async function _updateProduct(
  this: DatabaseQuery,
  id: number,
  dto: Product
): Promise<string> {
  const product = await this.get(`SELECT * FROM products WHERE id = ?`, [
    id.toString(),
  ]).catch(() => undefined);
  if (product === undefined) {
    throw new NotFoundError(`Product #${id} not found`);
  }
  await this.run(
    `UPDATE products SET name = ?, description = ?, type = ?, updated_at = ?`,
    [dto.name, dto.description, dto.type, new Date().toISOString()]
  );

  return `Product #${id} updated`;
}
async function _deleteProduct(
  this: DatabaseQuery,
  id: number
): Promise<string> {
  const product = await this.get(`SELECT * FROM products WHERE id = ?`, [
    id.toString(),
  ]).catch(() => undefined);
  if (product === undefined) {
    throw new NotFoundError(`Product #${id} not found`);
  }
  await this.run("DELETE FROM products WHERE id = ?", [id.toString()]);

  return `Product #${id} deleted`;
}
