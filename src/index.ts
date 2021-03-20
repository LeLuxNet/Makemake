import { readFile } from "fs/promises";
import { join } from "path";
import { Server } from "./server";
import fourChan from "./sites/4chan";

const cert = readFile(join(__dirname, "../cert.pem"), "utf-8");
const key = readFile(join(__dirname, "../key.pem"), "utf-8");

const main = async () => {
  const server = new Server({
    cert: await cert,
    key: await key,
  });

  await fourChan(server.dir("/4chan"));

  await server.listen();
  console.log("Listening");
};

main();
