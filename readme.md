# React TypeScript Webpack prerender template

> Minimal React project boilerplate with Webpack, TypeScript, CSS Modules, and a prerender facility.

This boilerplate is extremely minimal but gives you complete control over how you want to build your app, you should understand the configurations before using them.

## Usage

You can follow scripts configured in packages.json to serve, test, build, and prerender.

## Prerender support

We approach prerendering by building the application using different entry points that invoke different rendering APIs provided by React

- `ReactDom.render` is used for non-prerendered build or development.
- `ReactDOMServer.renderToString` is used for prerendering the application into static HTML files.
- `ReactDom.hydrate` is used by prerendered files to quickly hydrate application logic from generated HTML files.

The prerenderer will iterate through all paths queued to prerender, render your React app into HTML files then write them in a matching path inside the output directory. An object can be provided as bootstrap data and it will be baked into prerendered HTML for synchronous hydration. It also mirros the API endpoints and media files accessed during prerendering into static files so everything that needs to be deployed is created at the same time.

Change `prerender.ts` so the prerenderer is able to discover all routes you intend to prerender and access your API correctly

## Caveats

- No transpiler is currently configured, closure compiler is on the roadmap to be added
- No integration tests are currently configured.
