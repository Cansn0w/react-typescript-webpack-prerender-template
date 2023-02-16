import webpack from "webpack";
import {
  getReadableCSSModuleLocalIdent,
  getMinimalCSSModuleLocalIdent,
} from "./css-module-identifiers";
import { resolve } from "path";
import postcssNormalize from "postcss-normalize";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { merge } from "webpack-merge";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

type BuildConfiguration = {
  mode: "production" | "development" | undefined;
  dirname: string;
  devServer: boolean;
};

function createBaseConfig({
  mode,
  dirname,
  devServer,
}: BuildConfiguration): webpack.Configuration {
  const devMode = mode !== "production";
  return {
    bail: true,
    mode: mode || "production",
    context: resolve(dirname, "src"),
    output: {
      publicPath: "/",
    },
    module: {
      rules: [
        {
          test: /\.ts(x)?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            devServer
              ? require.resolve("style-loader")
              : {
                  loader: MiniCssExtractPlugin.loader,
                },
            {
              loader: require.resolve("css-loader"),
              options: {
                importLoaders: 1,
                sourceMap: devMode,
                modules: {
                  getLocalIdent: devMode
                    ? getReadableCSSModuleLocalIdent
                    : getMinimalCSSModuleLocalIdent,
                },
              },
            },
            {
              loader: require.resolve("postcss-loader"),
              options: {
                postcssOptions: {
                  plugins: [
                    [
                      require("postcss-preset-env"),
                      {
                        autoprefixer: {
                          flexbox: "no-2009",
                        },
                        stage: 3,
                      },
                    ],
                    // Adds PostCSS Normalize as the reset css with default options,
                    // so that it honors browserslist config in package.json
                    // which in turn let's users customize the target behavior as per their needs.
                    postcssNormalize(),
                  ],
                },
                sourceMap: devMode,
              },
            },
          ],
          // Don't consider CSS imports dead code even if the
          // containing package claims to have no side effects.
          // Remove this when webpack adds a warning or an error for this.
          // See https://github.com/webpack/webpack/issues/6571
          sideEffects: true,
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      extensions: [".js", ".ts", ".tsx"],
      modules: ["node_modules", "./src"],
    },
    plugins: [
      ...(devMode
        ? [
            new webpack.NormalModuleReplacementPlugin(
              /configurations\/configuration\.ts/gi,
              "./configuration.dev.ts"
            ),
          ]
        : []),
      new MiniCssExtractPlugin({
        filename: "styles.[contenthash].css",
      }),
    ],
    optimization: {
      minimizer: devMode ? [] : [`...` as const, new CssMinimizerPlugin()],
    },
    stats: "minimal" as const,
  };
}

export function createAppConfig(
  options: BuildConfiguration
): webpack.Configuration {
  const { mode, dirname, devServer } = options;
  const devMode = mode !== "production";
  return merge(createBaseConfig(options), {
    name: "app",
    entry: devServer ? "./main.tsx" : "./hydrate.ts",
    output: {
      filename: "[name].[contenthash].js",
      path: resolve(dirname, "dist/html"),
      clean: true,
    },
    plugins: [
      ...(devServer ? [] : [new CleanWebpackPlugin()]),
      new MiniCssExtractPlugin({
        filename: "styles.css",
      }),
      new HtmlWebpackPlugin({
        template: devServer ? "index.html" : "index.server.html",
        inject: "body",
        scriptLoading: "defer",
      }),
      ...(devServer
        ? []
        : [
            new BundleAnalyzerPlugin({
              analyzerMode: "static",
              reportFilename: "../report.html",
              openAnalyzer: false,
            }),
          ]),
    ],
    optimization: {
      runtimeChunk: "single",
    },
    devtool: devMode ? "inline-source-map" : undefined,
    performance: {
      hints: false,
    },
  });
}

export function createPrerenderConfig(
  options: BuildConfiguration
): webpack.Configuration {
  const { dirname } = options;

  return merge(createBaseConfig(options), {
    name: "prerender",
    entry: { prerender: "./prerender.ts" },
    output: {
      filename: "[name].js",
      path: resolve(dirname, "dist"),
    },
    target: "node",
  });
}

export function createAllConfig(options: BuildConfiguration) {
  return [createAppConfig(options), createPrerenderConfig(options)];
}
