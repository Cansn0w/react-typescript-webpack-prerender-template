import { createApp } from "app/create";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
} from "fs";
import { dirname, join } from "path";
import * as ReactDOMServer from "react-dom/server";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

async function parseArgs() {
  const args = await yargs(hideBin(process.argv))
    .option("api-dir", {
      alias: "api",
      demandOption: true,
      describe: "path to static api files",
      type: "string",
    })
    .help().argv;
  return {
    api: join(process.cwd(), args["api-dir"]),
  };
}

async function copyDirSync(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  let entries = readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    let srcPath = join(src, entry.name);
    let destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

// Update your prerender and path discovery logic accordingly
async function prerender({ api }: { api: string }) {
  process.chdir(__dirname);
  const WEB_ROOT = join(process.cwd(), "html");
  const htmlTemplate = readFileSync(join(WEB_ROOT, "index.html"), "utf8");

  // This function works with static API files for simplicity, you can extend it to make network requests to your services.
  function readAndExtractStaticAPI(path: string[]) {
    const resource = readFileSync(join(api, ...path, "index.json"), "utf8");
    const json = JSON.parse(resource);

    const filename = join(WEB_ROOT, ...path, "index.json");
    const dir = dirname(filename);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filename, resource);
    return json;
  }

  function render(bootstrap: { content: string }) {
    const content = ReactDOMServer.renderToString(createApp(bootstrap));
    return htmlTemplate
      .replace('"$bootstrap"', JSON.stringify(bootstrap))
      .replace("$content", content)
      .replace("$title", "Page");
  }

  function write(route: string, html: string, name = "index.html") {
    const filename = join(WEB_ROOT, route, name);
    const dir = dirname(filename);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filename, html);
  }

  const startTime = new Date().getTime();

  // collecte media
  console.log("collecting media files...");
  copyDirSync(join(api, "media"), join(WEB_ROOT, "media"));

  // prerender
  const routes = ["/"];

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    console.log(`Rendering ${route}`);
    const bootstrap = readAndExtractStaticAPI(["api"]);
    write(route, render(bootstrap));
  }

  console.log(`Rendering 404 page`);
  const bootstrap = { content: 'not found 🔍' };
  write("/", render(bootstrap), "404.html");

  const timeTaken = new Date().getTime() - startTime;
  console.log("--------------------------------");
  console.log(`Prerender finished in ${timeTaken / 1000}s.`);
}

parseArgs().then(prerender);
