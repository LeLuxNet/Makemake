export interface Request {
  fullPath: string;
  path: string;
  query: string;
  params: { [key: string]: string };
}
