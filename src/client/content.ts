import { Gemtext } from "./gemtext";

export type Document = Input | RawData | Gemtext;

export interface Input {
  type: "input";
  message: string;
  sensitive: boolean;
}

export interface RawData {
  type: "data";
  mime: string;
  body: Buffer;
}
