import { createServer, Server as TLSServer } from "tls";
import { URL } from "url";
import { Request } from "./request";
import { Response } from "./response";
import { Status } from "./status";

type GetCallback = (req: Request, res: Response) => void;

interface ServerOption {
  cert: string;
  key: string;
}

export class Server {
  listeners: [RegExp, GetCallback][] = [];
  server: TLSServer;

  constructor({ cert, key }: ServerOption) {
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

        const l = this.listeners.find(([regex, fn]) => {
          const match = path.match(regex);
          if (match === null) return false;

          const req: Request = {
            path,
            query: decodeURI(url.search.slice(1)),
            params: Object.assign({}, match.groups),
          };

          try {
            fn(req, res);
          } catch (err) {
            if (!res.sent) {
              res.status(Status.CGIError);
            }
            console.error(err);
          }
          return true;
        });

        if (l === undefined) {
          res.status(Status.NotFound);
        }
      });
    });

    this.server.addContext("localhost", {
      cert,
      key,
    });
  }

  get(path: string, fn: GetCallback) {
    if (path.startsWith("/")) {
      path = path.slice(1);
    }

    const regex = new RegExp(
      "^" + path.replace(/{([a-z]+)}/, "(?<$1>[^/]+)") + "$"
    );

    this.listeners.push([regex, fn]);
  }

  listen() {
    return new Promise<void>((resolve) => this.server.listen(1965, resolve));
  }
}
