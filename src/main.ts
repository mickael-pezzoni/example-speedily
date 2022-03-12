import { Server, NotFoundError, Controller, Context } from "speedily-js";
import { Database } from "sqlite3";
import DatabaseQuery from "./db.util";
import { CreateProductDto } from "./dtos/create-product.dto";

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
  const deleteProduct = _deleteProduct.bind(databaseQuery);

  const productController = new Controller("/products")
    .get("/", () => getProducts())
    .get("/:id", getProduct)
    .post("/", newProduct, { bodyValidator: CreateProductDto })
    .put("/:id", updateProduct)
    .delete("/:id", deleteProduct);

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

async function _getProduct(
  this: DatabaseQuery,
  context: Context
): Promise<Product> {
  const id = context.params.getOrFail<number>("id");
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
  context: Context
): Promise<string> {
  const dto = context.body.get<CreateProductDto>();
  const insertId = await this.run(
    "INSERT INTO products (name, description, type, created_at, updated_at) VALUES(?, ?, ?, ?, ?)",
    [
      dto.name,
      dto.description,
      dto.type,
      new Date().toISOString(),
      new Date().toISOString(),
    ]
  );

  return `Product #${insertId} created`;
}

async function _updateProduct(
  this: DatabaseQuery,
  context: Context
): Promise<string> {
  const dto = context.body.get<Product>();
  const id = context.params.getOrFail<number>("id");
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
  context: Context
): Promise<string> {
  const id = context.params.getOrFail<number>("id");
  const product = await this.get(`SELECT * FROM products WHERE id = ?`, [
    id.toString(),
  ]).catch(() => undefined);
  if (product === undefined) {
    throw new NotFoundError(`Product #${id} not found`);
  }
  await this.run("DELETE FROM products WHERE id = ?", [id.toString()]);

  return `Product #${id} deleted`;
}
