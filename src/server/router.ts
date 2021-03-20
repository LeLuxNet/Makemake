import { Request } from "./request";
import { Response } from "./response";
import { Status } from "./status";

export type GetCallback = (req: Request, res: Response) => void;

interface ListenerData {
  path: string;
  query: string;

  fullPath: string;
  res: Response;
}

export class Router {
  listeners: ((data: ListenerData) => boolean)[] = [];

  trigger(data: ListenerData) {
    return this.listeners.find((fn) => fn(data)) !== undefined;
  }

  get(path: string, fn: GetCallback) {
    if (path.startsWith("/")) path = path.slice(1);

    const regex = new RegExp(
      "^" + path.replace(/{([a-z]+)}/g, "(?<$1>[^/]+)") + "$"
    );

    this.listeners.push((data) => {
      const match = data.path.match(regex);
      if (match === null) return false;

      const req: Request = {
        fullPath: data.fullPath,
        path,
        query: data.query,
        params: Object.assign({}, match.groups),
      };

      try {
        fn(req, data.res);
      } catch (err) {
        if (!data.res.sent) {
          data.res.status(Status.CGIError);
        }
        console.error(err);
      }
      return true;
    });
  }

  dir(path: string) {
    if (path.startsWith("/")) path = path.slice(1);

    const router = new Router();

    this.listeners.push((data) => {
      const match = data.path.startsWith(path);
      if (!match) return false;

      const newData = Object.assign(data, {
        path: data.path.slice(path.length + 1),
      });
      router.trigger(newData);
      return true;
    });

    return router;
  }
}
