#!/usr/bin/env node

const WebpackDevServer = require("webpack-dev-server");
const webpack = require("webpack");
const serveStatic = require("serve-static");
const {
  createAppConfig,
  createPrerenderConfig,
  createAllConfig,
} = require("./scripts/webpack.config.js");

function getBuildConfig(target) {
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

function serve(port, entry, api) {
  const buildOptions = {
    dirname: __dirname,
    mode: "development",
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
          setupMiddlewares: (middlewares, devServer) => {
            if (!devServer) {
              throw new Error("webpack-dev-server is not defined");
            }

            middlewares.unshift(
              {
                name: "/api",
                path: "/api",
                middleware: serveStatic("mock/api", {
                  fallthrough: false,
                  index: "index.json",
                }),
              },
              {
                name: "/media",
                path: "/media",
                middleware: serveStatic("mock/media", {
                  fallthrough: false,
                  index: "index.json",
                }),
              }
            );

            return middlewares;
          },
        };
  const devServerConfig = {
    hot: true,
    historyApiFallback: true,
    port,
    ...apiConfig,
  };

  const server = new WebpackDevServer(devServerConfig, webpack(webpackConfig));
  server.startCallback(() => {
    console.log(`Starting server on http://localhost:${port}`);
  });
}

function build(mode, entry) {
  const buildOptions = {
    mode,
    dirname: __dirname,
    devServer: false,
  };
  const webpackConfig = getBuildConfig(entry)(buildOptions);

  webpack(webpackConfig, (err, stats) => {
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      return;
    }

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
  });
}

require("yargs")
  .scriptName("webpack")
  .usage("$0 <command> [<args>]")
  .command(
    "serve [entry] [port] [api]",
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
          default: "8080",
        })
        .option("api", {
          describe: "address of the api endpoint to proxy through",
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
    function ({ port, entry, api }) {
      serve(port, entry, api);
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
            if (arg === "dev") {
              return "development";
            } else if (arg === "prod") {
              return "production";
            } else return arg;
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
