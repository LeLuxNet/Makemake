import { connect } from "tls";
import { URL } from "url";
import { Document } from "./content";
import { GemtextLine } from "./gemtext";

export function get(url: URL) {
  const socket = connect(
    {
      host: url.host,
      port: 1965,
      rejectUnauthorized: false,
    },
    () => {
      socket.write(url.toString());
      socket.write("\r\n");
    }
  );

  socket.setEncoding("utf8");

  var buf = Buffer.alloc(0, undefined, "utf-8");
  socket.on("data", (data) => {
    buf = Buffer.concat([buf, Buffer.from(data)]);
  });

  return new Promise<Document | null>((resolve) => {
    socket.on("error", (err) => {
      if (err.code === "ENOTFOUND") {
        return resolve(null);
      }
      throw err;
    });

    socket.on("end", () => {
      const status = buf.slice(0, 2).toString();
      const headerEnd = buf.indexOf("\r\n");
      const meta = buf.slice(3, headerEnd).toString();
      const body = buf.slice(headerEnd + 1);

      var doc: Document;
      switch (status[0]) {
        case "1":
          doc = {
            type: "input",
            message: meta,
            sensitive: status[1] === "1",
          };
          break;
        case "2":
          if (meta === "text/gemini") {
            doc = {
              type: "gemtext",
              lines: parseGemtext(body.toString()),
            };
          } else {
            doc = {
              type: "data",
              mime: meta,
              body,
            };
          }
          break;
        default:
          throw status;
      }

      resolve(doc);
    });
  });
}

function parseGemtext(body: string) {
  const lines: GemtextLine[] = [];
  const rawLines = body.split("\n");

  while (true) {
    const raw = rawLines.shift();
    if (raw === undefined) break;

    if (raw.startsWith("#")) {
      var heading: 1 | 2 | 3 = 1;
      if (raw.startsWith("##")) {
        heading = 2;
        if (raw.startsWith("###")) {
          heading = 3;
        }
      }
      lines.push({
        type: "heading",
        heading,
        content: raw.slice(heading).trim(),
      });
    } else if (raw.startsWith(">")) {
      lines.push({
        type: "quote",
        content: raw.slice(1).trim(),
      });
    } else if (raw.startsWith("=>")) {
      const unprefixed = raw.slice(2).trimStart();
      const match = unprefixed.match(/([^\s]+)\s(.*)/);
      lines.push({
        type: "link",
        url: match![1],
        content: match![2],
      });
    } else if (raw.startsWith("* ")) {
      const entries = [raw.slice(2).trim()];
      while (rawLines[0]?.startsWith("* ")) {
        entries.push(rawLines.shift()!.slice(2).trim());
      }
      lines.push({
        type: "list",
        entries,
      });
    } else if (raw.startsWith("```")) {
      const l: string[] = [];
      while (rawLines[0] !== undefined && !rawLines[0].startsWith("```")) {
        l.push(rawLines.shift()!);
      }
      rawLines.shift();
      lines.push({
        type: "code",
        content: l.join("\n"),
      });
    } else {
      lines.push({
        type: "text",
        content: raw,
      });
    }
  }

  return lines;
}
