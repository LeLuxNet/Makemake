import { createServer, Server as TLSServer } from "tls";
import { URL } from "url";
import { Request } from "./request";
import { Response } from "./response";
import { Status } from "./status";

interface ServerOption {
  cert: string;
  key: string;
}

export class Server {
  listeners: ((req: Request, res: Response) => void)[] = [];
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

        const res = new Response(socket);
        const req: Request = {
          path: url.pathname.slice(1),
          query: decodeURI(url.search.slice(1)),
        };

        this.listeners.forEach((f) => {
          try {
            f(req, res);
          } catch (err) {
            console.error(err);
            if (!res.sent) {
              res.status(Status.CGIError);
            }
          }
        });
      });
    });

    this.server.addContext("localhost", {
      cert,
      key,
    });
  }

  get(fn: (req: Request, res: Response) => void) {
    this.listeners.push(fn);
  }

  listen() {
    this.server.listen(1965, () => {
      console.log("Listening");
    });
  }
}
