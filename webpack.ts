#!/usr/bin/env ts-node

import WebpackDevServer from "webpack-dev-server";
import webpack from "webpack";
import serveStatic from "serve-static";
import {
  createAppConfig,
  createPrerenderConfig,
  createAllConfig,
} from "./scripts/webpack.config";
import * as yargs from "yargs";

function getBuildConfig(target: string) {
  switch (target) {
    case "app":
      return createAppConfig;
    case "prerender":
      return createPrerenderConfig;
    case "all":
      return createAllConfig;
    default:
      throw new Error(`build target not found, received ${target}`);
  }
}

function runWebpack(
  config: webpack.Configuration | webpack.Configuration[],
  callback?: (
    error: Error | undefined,
    stats: webpack.Stats | webpack.MultiStats | undefined
  ) => void
) {
  if (Array.isArray(config)) {
    return webpack(config, callback);
  }
  return webpack(config, callback);
}

function serve(
  port: number,
  entry: string,
  api: string | undefined,
  bind: boolean
) {
  const buildOptions = {
    dirname: __dirname,
    mode: "development" as const,
    devServer: true,
  };
  const webpackConfig = getBuildConfig(entry)(buildOptions);
  const apiConfig =
    api != null
      ? {
          proxy: {
            "/api": api,
            "/media": api,
          },
        }
      : {
          setupMiddlewares: (middlewares: WebpackDevServer.Middleware[]) => {
            const serveApi = serveStatic("mock/api", {
              fallthrough: false,
              index: "index.json",
            });
            const ApiMiddleware: WebpackDevServer.RequestHandler = (
              ...args
            ) => {
              serveApi(...args);
            };
            const serveMedia = serveStatic("mock/media", {
              fallthrough: false,
              index: "index.json",
            });
            const MediaMiddleware: WebpackDevServer.RequestHandler = (
              ...args
            ) => {
              serveMedia(...args);
            };
            middlewares.unshift({
              path: "/api",
              middleware: ApiMiddleware,
            });
            middlewares.unshift({
              path: "/media",
              middleware: MediaMiddleware,
            });
            return middlewares;
          },
        };
  /**
   * @type {WebpackDevServer.Configuration}
   */
  const devServerConfig = {
    hot: true,
    historyApiFallback: true,
    host: bind ? "0.0.0.0" : "127.0.0.1",
    port,
    devMiddleware: {
      stats: "minimal" as const,
    },
    ...apiConfig,
  };

  const server = new WebpackDevServer(
    devServerConfig,
    runWebpack(webpackConfig)
  );
  server.startCallback(() => {
    console.log(`Starting server on http://localhost:${port}`);
  });
}

function build(mode: "development" | "production", entry: string) {
  const buildOptions = {
    mode,
    dirname: __dirname,
    devServer: false,
  };
  const webpackConfig = getBuildConfig(entry)(buildOptions);

  runWebpack(webpackConfig, (err, stats) => {
    if (err) {
      console.error(err.stack || err);
      return;
    }

    if (stats != null) {
      const info = stats.toJson();
      if (stats.hasErrors()) {
        console.error(info.errors);
      }

      if (stats.hasWarnings()) {
        console.warn(info.warnings);
      }
      process.stdout.write(
        stats.toString({
          colors: true,
          modules: false,
          chunks: false,
          chunkModules: false,
          assets: false,
        }) + "\n"
      );
    }
  });
}

yargs
  .scriptName("webpack")
  .usage("$0 <command> [<args>]")
  .command(
    "serve [entry] [port] [api] [bind]",
    "start webpack dev server",
    (yargs) => {
      return yargs
        .option("entry", {
          alias: "e",
          type: "string",
          choices: ["app"],
          default: "app",
        })
        .option("port", {
          alias: "p",
          describe: "port number the server will bind to",
          default: 8080,
        })
        .option("api", {
          type: "string",
          describe: "address of the api endpoint to proxy through",
        })
        .option("bind", {
          alias: "b",
          type: "boolean",
          default: false,
          describe: "open the devserver to the local area network",
        })
        .version(false)
        .check(({ port }) => {
          if (isNaN(Number(port))) {
            throw Error(
              `Error: port number needs to be a number, received "${port}"`
            );
          }
          return true;
        });
    },
    function ({ port, entry, api, bind }) {
      serve(port, entry, api, bind);
    }
  )
  .command(
    "build [mode] [entry]",
    "build the application",
    (yargs) => {
      return yargs
        .option("mode", {
          alias: "m",
          default: "production",
          describe: "build mode, must be one of production or development",
          coerce(arg) {
            if (arg === "dev" || arg === "development") {
              return "development";
            } else if (arg === "prod" || arg === "production") {
              return "production";
            } else {
              throw new Error(`Unsupported build mode ${arg}`);
            }
          },
          choices: ["development", "production"],
          type: "string",
        })
        .option("entry", {
          alias: "e",
          type: "string",
          choices: ["all", "prerender", "app"],
          default: "all",
        })
        .version(false);
    },
    function ({ mode, entry }) {
      build(mode, entry);
    }
  )
  .demandCommand(1, "")
  .help().argv;
