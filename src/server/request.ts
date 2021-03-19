export interface Request {
  path: string;
  query: string;
  params: { [key: string]: string };
}
