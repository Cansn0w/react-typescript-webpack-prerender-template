const webpack = require("webpack");
const {
  getReadableCSSModuleLocalIdent,
  getMinimalCSSModuleLocalIdent,
} = require("./css-module-identifiers");
const { resolve } = require("path");
const postcssNormalize = require("postcss-normalize");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { merge } = require("webpack-merge");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

/**
 * @param {{
 *   mode: string,
 *   dirname: string,
 *   devServer: boolean,
 * }} options
 */
function createBaseConfig({ mode, dirname, devServer }) {
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
          test: /\.svg$/,
          use: "file-loader",
        },
        {
          test: /\.png$/,
          use: [
            {
              loader: "url-loader",
              options: {
                mimetype: "image/png",
              },
            },
          ],
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
        filename: "styles.css",
      }),
    ],
    optimization: {
      minimizer: devMode ? [] : [`...`, new CssMinimizerPlugin()],
    },
    stats: "minimal",
  };
}

/**
 * @param {{
 *   mode: string,
 *   dirname: string,
 *   devServer: boolean,
 * }} options
 */
function createAppConfig(options) {
  const { mode, dirname, devServer } = options;
  const devMode = mode !== "production";
  return merge(createBaseConfig(options), {
    name: "app",
    entry: devServer ? "./main.tsx" : "./hydrate.ts",
    output: {
      filename: "[name].[contenthash].js",
      path: resolve(dirname, "dist/html"),
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

/**
 * @param {{
 *   mode: string,
 *   dirname: string,
 *   devServer: boolean,
 * }} options
 */
function createPrerenderConfig(options) {
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

/**
 * @param {{
 *   mode: string,
 *   dirname: string,
 *   devServer: boolean,
 * }} options
 */
function createAllConfig(options) {
  return [createAppConfig(options), createPrerenderConfig(options)];
}

module.exports = {
  createAppConfig,
  createPrerenderConfig,
  createAllConfig,
};
