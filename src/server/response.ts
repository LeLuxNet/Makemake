import { Socket } from "net";
import { Status } from "./status";

export class Response {
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  input(prompt: string) {
    return this._send(Status.INPUT, prompt);
  }

  _send(status: number, meta: string = "text/gemini", body?: string) {
    this.socket.end(
      `${status} ${meta}\r\n` + (body !== undefined ? `${body}\r\n` : "")
    );
  }
}
