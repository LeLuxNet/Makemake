import EventEmitter from "events";
import { createServer, Server as TLSServer } from "tls";
import { Request } from "./request";
import { Response } from "./response";

interface ServerOption {
  cert: string;
  key: string;
}

export declare interface Server {
  emit(event: "req", req: Request, res: Response): boolean;
  on(event: "req", listener: (req: Request, res: Response) => void): this;
}

export class Server extends EventEmitter {
  server: TLSServer;

  constructor({ cert, key }: ServerOption) {
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

        const url = buf.toString();

        const req = new Request(url);
        const res = new Response(socket);

        this.emit("req", req, res);
      });
    });

    this.server.addContext("localhost", {
      cert,
      key,
    });
  }

  listen() {
    this.server.listen(1965, () => {
      console.log("Listening");
    });
  }
}
