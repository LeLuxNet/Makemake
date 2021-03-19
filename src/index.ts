import { readFile } from "fs/promises";
import { join } from "path";
import { Server } from "./server";

const main = async () => {
  const server = new Server({
    cert: await readFile(join(__dirname, "../cert.pem"), "ascii"),
    key: await readFile(join(__dirname, "../key.pem"), "ascii"),
  });

  server.get((req, res) => {
    console.log(req);
    res.content("Hello world!");
  });

  server.listen();
};

main();
