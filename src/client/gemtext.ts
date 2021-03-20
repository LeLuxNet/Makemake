export interface Gemtext {
  type: "gemtext";
  lines: GemtextLine[];
}

export type GemtextLine =
  | GemtextText
  | GemtextLink
  | GemtextHeading
  | GemtextList;

interface GemtextText {
  type: "text" | "quote" | "code";
  content: string;
}

interface GemtextLink {
  type: "link";
  content?: string;
  url: string;
}

interface GemtextHeading {
  type: "heading";
  heading: 1 | 2 | 3;
  content: string;
}

interface GemtextList {
  type: "list";
  entries: string[];
}
