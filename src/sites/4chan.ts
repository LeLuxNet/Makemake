import axios, { AxiosError } from "axios";
import { load } from "cheerio";
import { heading, intLink } from "../server/content";
import { Router } from "../server/router";
import { Status } from "../server/status";

const api = axios.create({ baseURL: "https://a.4cdn.org" });

interface Board {
  key: string;
  title: string;
}

export default async function fourChan(router: Router) {
  const boardMap: { [key: string]: Board } = {};
  const boards: Board[] = [];

  const res = await api.get("boards.json");
  res.data.boards.forEach((b: any) => {
    const board: Board = {
      key: b.board,
      title: b.title,
    };

    boardMap[board.key] = board;
    boards.push(board);
  });

  router.get("/", async (req, res) => {
    res.content([
      heading(1, "4chan"),
      heading(2, "boards"),
      ...boards.map((board) => intLink(req, board.key, board.title)),
    ]);
  });

  router.get("/{board}", async (req, res) => {
    const board = boardMap[req.params.board];
    if (board === undefined) return res.status(Status.NotFound);

    const res2 = await api.get(`${req.params.board}/threads.json`);
    const threads = res2.data[0].threads;

    res.content([
      heading(1, "4chan"),
      heading(2, `/${board.key}/ - ${board.title}`),
      ...threads.map((t: any) =>
        intLink(req, `thread/${t.no}`, `${t.no} [${t.replies}]`)
      ),
    ]);
  });

  router.get("/{board}/thread/{thread}", (req, res) => {
    api
      .get(`${req.params.board}/thread/${req.params.thread}.json`)
      .then((res2) => {
        const posts = res2.data.posts;

        res.content([
          heading(1, "4chan"),
          ...posts.map((p: any) => {
            var body: string[] = [];
            if (p.filename !== undefined) {
              body.push(
                intLink(
                  req,
                  `../../images/${p.tim}${p.ext}`,
                  `${p.filename}${p.ext}`
                )
              );
            }

            if (p.com !== undefined) {
              const $ = load(p.com);
              //body.push(code(p.com));

              for (const line of $("body").contents()) {
                if (line.type === "tag") {
                  const l = $(line);
                  if (line.tagName === "br") continue;
                  else if (l.hasClass("quotelink")) {
                    if (l.text().startsWith(">>>")) {
                      body.push(intLink(req, l.prop("href"), l.text()));
                    } else {
                      const id = l.text().slice(2);
                      const op = req.params.thread === id;
                      body.push(
                        intLink(
                          req,
                          `../${req.params.thread}`,
                          `>>${id}${op ? " (OP)" : ""}`
                        )
                      );
                    }
                  } else if (l.hasClass("deadlink")) {
                    body.push(` ${l.text()}`);
                  }
                } else if (line.type === "text") {
                  body.push(line.data || "");
                }
              }
            }
            return [heading(3, `${p.name} - ${p.no}`), ...body].join("\n");
          }),
        ]);
      })
      .catch((err: AxiosError) => {
        res.status(Status.NotFound);
      });
  });

  router.get("/{board}/images/{image}", (req, res) => {
    res.mediaHttp(`https://i.4cdn.org/${req.params.board}/${req.params.image}`);
  });
}
