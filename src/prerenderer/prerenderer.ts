import { promises as fs } from "fs";
import { dirname, join } from "path";
import { Scheduler, SemaphoreScheduler, NoopScheduler } from "./scheduler";

type CopyFileOverride = {
  test(src: string): boolean;
  copy(src: string, dest: string): Promise<void>;
};

/**
 * Copy all files from a directory to another,
 * accepts an interceptor to perform additional side effects or transformations in the process.
 */
async function copyDir(src: string, dest: string, override?: CopyFileOverride) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, override);
    } else {
      if (override?.test(srcPath)) {
        await override.copy(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

type PrerendererOptions = {
  /**
   * callback to render a route into html, expecting full html string including doc type declaration and the html tag
   * @param queue allow additional routes to be discovered as queued during rendering
   */
  render: (route: string, queue: (route: string) => void) => Promise<string>;
  renderNotFound?: () => Promise<string>;
  /**
   * number of concurrent prerender tasks allow, default: undefined - unlimited
   */
  concurrency?: number | undefined;
  /**
   * root directory of the website, default: "html"
   */
  context?: string;
  /**
   * directories to be copied into the root directory
   */
  copy?: {
    from: string;
    to: string;
    message?: string;
    override?: CopyFileOverride;
  }[];
};

/**
 * A class to facilitate and support all prerender tasks
 */
export class Prerenderer {
  private routes = new Set<string>();
  private completed = 0;
  private scheduler: Scheduler<void>;
  private done: Promise<void>;
  private queue: (route: string) => void;
  private renderNotFound?: () => Promise<string>;
  private root: string;
  private copy: {
    from: string;
    to: string;
    message?: string;
    override?: CopyFileOverride;
  }[];

  constructor({
    render,
    renderNotFound,
    context,
    concurrency,
    copy = [],
  }: PrerendererOptions) {
    this.scheduler =
      concurrency == null
        ? new NoopScheduler()
        : new SemaphoreScheduler(concurrency);
    this.copy = copy;
    this.root = context ?? join(__dirname, "html");
    this.renderNotFound = renderNotFound;
    let emitDone: (() => void) | undefined;
    this.done = new Promise((res) => {
      emitDone = res;
    });
    this.queue = async (route: string) => {
      if (this.routes.has(route)) {
        return;
      }
      this.routes.add(route);
      this.scheduler.run(async () => {
        console.log(`Rendering ${route}`);
        await this.write(route, await render(route, this.queue));
        this.completed += 1;
        if (this.routes.size === this.completed) {
          emitDone?.();
        }
      });
    };
  }

  async render(routes: string[] = []): Promise<void> {
    const startTime = new Date().getTime();

    await Promise.all(
      this.copy.map(({ from, to, message, override }) => {
        if (message != null) {
          console.log(message);
        } else {
          console.log(`Copying files from ${from} to ${to}`);
        }
        return copyDir(from, to, override);
      }),
    );

    const task404 = this.scheduler.run(async () => {
      if (this.renderNotFound != null) {
        console.log(`Rendering 404 page`);
        await this.write("/", await this.renderNotFound(), "404.html");
      }
    });

    routes.forEach(this.queue);

    await Promise.all([this.done, task404]);

    const timeTaken = new Date().getTime() - startTime;
    console.log("--------------------------------");
    console.log(`Prerender finished in ${timeTaken / 1000}s.`);
  }

  private async write(route: string, html: string, name = "index.html") {
    const filename = join(this.root, route, name);
    await fs.mkdir(dirname(filename), { recursive: true });
    await fs.writeFile(filename, html);
  }
}
