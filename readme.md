# React TypeScript Webpack prerender template

> Minimal React project boilerplate with Webpack, TypeScript, CSS Modules, and a prerender facility.

This boilerplate is extremely minimal but gives you complete control over how you want to build your app, you should understand the configurations before using them.

## Usage

You can follow scripts configured in `packages.json` to serve, test, build, and prerender.

### Start the web app locally

Run

```sh
npm start
```

Use the `--help` option to see more options. Note when passing options via npm to the underlying program, `--` is required before those options.

```sh
npm start -- --help
```

#### Proxying

Two packages inside the `static/` directory will be served on `/data/` and `/media/` path respectively when the app is running locally.
It will also be copied during the build process and become part of the final bundle.

For convenience, when the `--api` option is provided, the given endpoint will be proxied on the `/api/` path and become accessible during local development. e.g.

```sh
npm start -- --api https://checkip.amazonaws.com/
```

## Dependencies

Require node 18, run `npm i` from repository root to install other dependencies.

## Prerender support

Scripts are included to render a static web app from optional static APIs.

We approach prerendering by building the application using different entry points that invoke different React rendering APIs

- `ReactDom.render` is used for non-prerendered build or development.
- `ReactDOMServer.renderToString` is used for prerendering the application into static HTML files.
- `ReactDom.hydrate` is used by prerendered files to quickly hydrate application logic from generated HTML files.

The prerenderer will iterate through all paths queued to prerender, render your React app into HTML files and write them in a matching path inside the output directory. An object can be provided as bootstrap data and it will be baked into prerendered HTML for synchronous hydration. It also mirrors the API endpoints and media files accessed during prerendering into static files so everything that needs to be deployed is created at the same time.

Change `prerender.ts` so the prerenderer is able to discover all routes you intend to prerender and access your API correctly

## Notes

- No transpiler is currently configured, ideally we'd like to add closure compiler into the pipeline.
- Webpack uses Terser as the minimizer by default.
- No integration test runner is currently configured.
