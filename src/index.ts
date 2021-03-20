import express from "express";
import { readFile } from "fs/promises";
import { join } from "path";
import { URL } from "url";
import { get } from "./client";
import { Server } from "./server";
import fourChan from "./sites/4chan";
import reddit from "./sites/reddit";

const cert = readFile(join(__dirname, "../cert.pem"), "utf-8");
const key = readFile(join(__dirname, "../key.pem"), "utf-8");

const main = async () => {
  const server = new Server({
    cert: await cert,
    key: await key,
  });

  await fourChan(server.dir("/4chan"));
  await reddit(server.dir("/reddit"));

  await server.listen();
  console.log("Listening");

  const app = express();

  app.get("/*", async (req, res) => {
    const url = new URL(`gemini:/${req.path}`);
    const res2 = await get(url);
    if (res2 === null) {
      res.sendStatus(404);
      return;
    }

    if (res2.type === "gemtext") {
      const body = res2.lines
        .map((l) => {
          switch (l.type) {
            case "text":
              return `<p>${l.content}</p>`;
            case "link":
              return `<p><a href="${l.url}">${l.content}</a></p>`;
            case "heading":
              return `<h${l.heading}>${l.content}</h${l.heading}>`;
            case "list":
              return `<ul>${l.entries
                .map((e) => `<li>${e}</li>`)
                .join("")}</ul>`;
            case "quote":
              return `<blockquote>${l.content}</blockquote>`;
            case "code":
              return `<pre>${l.content}</pre>`;
          }
        })
        .join("");
      res.send(body);
    }
  });

  app.listen(80, () => {
    console.log(`Listening on port ${80}`);
  });
};

main();
