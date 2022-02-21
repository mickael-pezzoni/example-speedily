import fetch from "node-fetch";
import { Server, NotFoundError, Controller, Params, Body } from "speedily-js";

const server = new Server(3000);

const homeController = new Controller("")
  .get("/", () => {
    return "Home";
  })
  .get("/contact", () => "Contact");

interface Product {
  id: number;
  name: string;
}

const products: Product[] = [
  { id: 1, name: "product_1" },
  { id: 2, name: "product_2" },
  { id: 3, name: "product_3" },
];

const productController = new Controller("/products")
  .get("/", () => products)
  .get("/:id", (param) => getProduct(param))
  .post("/", (param, body) => newProduct(param, body))
  .put("/:id", (param, body) => updateProduct(param, body))
  .delete("/:id", (param) => deleteProduct(param));

server.setControllers([homeController, productController]);

function newProduct(param: Params, body: Body): Product {
  const toCreate = body as Product;
  const addedProduct = products.push(toCreate);
  return products[addedProduct - 1];
}
function updateProduct(param: Params, body: Body): Product {
  const { id } = param;
  const toUpdate = body as Product;
  const productIndex = products.findIndex((product) => product.id === +id);

  if (productIndex === -1) {
    throw new NotFoundError(`Product #${id} not found`);
  }
  products[productIndex] = toUpdate;

  return products[productIndex];
}
function getProduct(param: Params): Product {
  const { id } = param;
  const product = products.find((p) => p.id === +id);

  if (product === undefined) {
    throw new NotFoundError(`Product #${id} not found`);
  }
  return product;
}

function deleteProduct(param: Params): string {
  const { id } = param;
  const productIndex = products.findIndex((p) => p.id === +id);

  if (productIndex === -1) {
    throw new NotFoundError(`Product #${id} not found`);
  }
  products.splice(productIndex);

  return `Product #${id} deleted`;
}
server.run();

async function getLocation(): Promise<unknown> {
  const response = await fetch("http://ip-api.com/json", { method: "GET" });

  return response.json();
}
