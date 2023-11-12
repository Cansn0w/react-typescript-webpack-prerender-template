import { Writable } from "stream";
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";

export function renderToString(content: React.ReactNode) {
  const { pipe } = ReactDOMServer.renderToPipeableStream(content);
  return new Promise<string>((res) => {
    const chunks: Buffer[] = [];
    pipe(
      new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk);
          callback();
        },
        final(callback) {
          res(Buffer.concat(chunks).toString());
          callback();
        },
      }),
    );
  });
}
