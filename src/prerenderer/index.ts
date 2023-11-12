import { createApp } from "app/create";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { Prerenderer } from "./prerenderer";
import { renderToString } from "./render";

/**
 * Function that renders a list of routes into html files
 */
export async function prerender(routes: string[]) {
  const staticDir = join(dirname(__dirname), "static");
  const htmlRoot = join(__dirname, "html");
  const htmlTemplate = await fs.readFile(join(htmlRoot, "index.html"), "utf-8");

  /**
   * Function to map routes into strings.
   *
   * Modify this function to support more capabilities such as prefetch data or adding react router.
   */
  async function renderToHtml(route: string): Promise<string> {
    const bootstrap = await fs.readFile(
      join(htmlRoot, "data", route, "index.json"),
      "utf8",
    );
    const content = await renderToString(createApp(JSON.parse(bootstrap)));
    return htmlTemplate
      .replace('"$bootstrap"', bootstrap)
      .replace(`<div id="root"></div>`, `<div id="root">${content}</div>`)
      .replace("$title", "Page");
  }

  const prerenderer = new Prerenderer({
    render: (route) => {
      return renderToHtml(route);
    },
    copy: [
      {
        message: "collecting media files...",
        from: join(staticDir, "media"),
        to: join(htmlRoot, "media"),
      },
      {
        message: "copying static data files...",
        from: join(staticDir, "data"),
        to: join(htmlRoot, "data"),
        override: {
          test(file) {
            return file.endsWith(".json");
          },
          async copy(src, dest) {
            fs.writeFile(
              dest,
              JSON.stringify(JSON.parse(await fs.readFile(src, "utf8"))),
            );
          },
        },
      },
    ],
  });

  return prerenderer.render(routes);
}
