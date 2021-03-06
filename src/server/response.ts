import axios from "axios";
import { Socket } from "net";
import { Readable } from "stream";
import { Status } from "./status";

export class Response {
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;

    this.socket.on("error", (err) => {
      if ((err as any).code === "ECONNRESET") return;

      throw err;
    });
  }

  input(prompt: string, secure: boolean = false) {
    return this._send(secure ? Status.SensitiveInput : Status.Input, prompt);
  }

  redirect(url: string, temporary: boolean = true) {
    return this._send(
      temporary ? Status.RedirectTemporary : Status.RedirectPermanent,
      url
    );
  }

  content(content: string | string[], lang?: string) {
    return this._send(
      Status.Success,
      "text/gemini" + (lang === undefined ? "" : `; lang=${lang}`),
      typeof content === "string" ? content : content.join("\n")
    );
  }

  media(mimeType: string, data: string) {
    return this._send(Status.Success, mimeType, data);
  }

  async mediaHttp(url: string) {
    const res = await axios.get(url, {
      responseType: "stream",
    });
    return this._send(Status.Success, res.headers["content-type"], res.data);
  }

  rateLimit(seconds: number) {
    return this._send(Status.SlowDown, seconds.toString());
  }

  status(code: Status) {
    return this._send(code, "");
  }

  get sent() {
    return !this.socket.writable;
  }

  _send(status: Status, meta: string, body?: string | Readable) {
    if (this.sent) throw "The response has already been sent";

    this.socket.write(`${status} ${meta}\r\n`);
    if (body !== undefined) {
      if (typeof body === "string") {
        this.socket.write(body);
      } else {
        body.pipe(this.socket);
        return;
      }
    }
    this.socket.end();
  }
}
