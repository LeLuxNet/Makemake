import axios from "axios";
import { heading, intLink } from "../server/content";
import { Request } from "../server/request";
import { Router } from "../server/router";

const api = axios.create({ baseURL: "https://reddit.com" });

export default async function reddit(router: Router) {
  router.get("/r/{sub}", async (req, res) => {
    const res2 = await api.get(`r/${req.params.sub}.json`);
    const posts = res2.data.data.children;

    res.content([
      heading(1, "Reddit"),
      heading(2, `r/${req.params.sub}`),
      ...posts.map((p: any) => post(req, p.data, false).join("\n")),
    ]);
  });

  router.get("/r/{sub}/comments/{id}", async (req, res) => {
    const res2 = await api.get(
      `r/${req.params.sub}/comments/${req.params.id}/top.json`
    );
    const data = res2.data[0].data.children[0].data;

    res.content([
      heading(1, "Reddit"),
      heading(2, `r/${req.params.sub}`),
      ...post(req, data, true),
    ]);
  });

  router.get("/image/{ext}/{name}/{key}", async (req, res) => {
    res.mediaHttp(
      `https://${req.params.ext === "x" ? "external-" : ""}preview.redd.it/${
        req.params.name
      }?auto=webp&s=${req.params.key}`
    );
  });

  router.get("/video/{name}/{res}", async (req, res) => {
    res.mediaHttp(
      `https://v.redd.it/${req.params.name}/DASH_${req.params.res}.mp4`
    );
  });
}

function post(req: Request, data: any, full: boolean) {
  const body = [heading(3, data.title)];

  const text: string = data.selftext.trim().replace(/\n\n/g, "\n");
  if (text !== "") {
    if (full || text.length < 200) {
      body.push(text);
    } else {
      body.push(text.slice(0, 200));
      body.push(
        intLink(req, `comments/${data.name.split("_")[1]}`, "Read more")
      );
    }
  }
  if (data.media?.reddit_video !== undefined) {
    const video = data.media.reddit_video.fallback_url;
    const videoName = video.split("/")[3];
    const videoRes = video.split("_")[1].split(".")[0];
    body.push(intLink(req, `../../video/${videoName}/${videoRes}`, data.url));
  } else if (data.preview !== undefined) {
    const image: string = data.preview.images[0].source.url;
    const imageName = image.split("/")[3].split("?")[0];
    const imageKey = image.split("=").pop();
    body.push(
      intLink(
        req,
        `../../image/${
          image.startsWith("https://external-") ? "x" : "i"
        }/${imageName}/${imageKey}`,
        data.url
      )
    );
  }

  body.push(data.score >= 0 ? `↑ ${data.score}` : `↓ ${-data.score}`);

  return body;
}
