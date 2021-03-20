import { createServer, Server as TLSServer } from "tls";
import { URL } from "url";
import { Response } from "./response";
import { Router } from "./router";
import { Status } from "./status";

interface ServerOption {
  cert: string;
  key: string;
  host?: string;
}

export class Server extends Router {
  server: TLSServer;

  constructor({ cert, key, host = "localhost" }: ServerOption) {
    super();

    this.server = createServer((socket) => {
      socket.once("readable", () => {
        var buf: Buffer = Buffer.alloc(0);

        while (true) {
          const reqBuf: Buffer = socket.read();

          const i = reqBuf.indexOf("\r\n");
          if (i !== -1) {
            buf = Buffer.concat([buf, reqBuf.slice(0, i)]);
            break;
          } else {
            buf = Buffer.concat([buf, reqBuf]);
          }
        }

        const url = new URL(buf.toString());
        const path = url.pathname.slice(1);

        const res = new Response(socket);

        const found = this.trigger({
          fullPath: path,
          path,
          query: decodeURI(url.search.slice(1)),
          res,
        });

        if (!found) {
          res.status(Status.NotFound);
        }
      });
    });

    this.server.addContext(host, {
      cert,
      key,
    });
  }

  listen() {
    return new Promise<void>((resolve) => this.server.listen(1965, resolve));
  }
}
