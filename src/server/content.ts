export function link(url: string, title?: string) {
  if (title === undefined) {
    return `=> ${url}`;
  } else {
    return `=> ${url} ${title}`;
  }
}

export function code(...content: string[]) {
  return "```\n" + content.join("\n") + "\n```";
}

export function heading(level: 1 | 2 | 3, ...content: string[]) {
  return content.map((l) => `${"#".repeat(level)} ${l}`).join("\n");
}

export function list(...content: string[]) {
  return content.map((l) => `* ${l}`).join("\n");
}

export function quote(...content: string[]) {
  return content.map((l) => `> ${l}`).join("\n");
}
