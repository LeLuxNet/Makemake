import { readFile } from "fs/promises";
import { join } from "path";
import fourChan from "./4chan";
import { Server } from "./server";

const cert = readFile(join(__dirname, "../cert.pem"), "utf-8");
const key = readFile(join(__dirname, "../key.pem"), "utf-8");

const main = async () => {
  const server = new Server({
    cert: await cert,
    key: await key,
  });

  await fourChan("/4chan", server);

  await server.listen();
  console.log("Listening");
};

main();
