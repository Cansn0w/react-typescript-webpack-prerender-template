import WebpackDevServer from "webpack-dev-server";
import serveStatic from "serve-static";
import { createProxyMiddleware } from "http-proxy-middleware";

export function createStaticMiddleware(
  path: string,
  dir: string,
): WebpackDevServer.Middleware {
  const middleware = serveStatic(dir, {
    fallthrough: false,
    index: "index.json",
  });
  return {
    path,
    middleware,
  };
}

/**
 * Setup services for local development by proxying requests to the given endpoint.
 */
export function createLocalServices(
  target: string,
): WebpackDevServer.ExpressRequestHandler {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
  });
}
