import webpack from "webpack";
import loaderUtils from "loader-utils";
import * as fs from "fs";

/**
 * Webpack plugin to create minimal css classnames.
 *
 * Make sure to include `CssModuleClassNameMinifierPlugin.getLocalIdent` in your options to css-loader.
 *
 * To create minimal classnames, we simply use the fewest characters possible without deriving
 * a name from the original class name. Therefore, this plugin have to create a file
 * to keep track of all css names within the project to ensure names used by the prerender
 * matches the app, with also added benefit of creating stable class names across builds.
 *
 * You should check in the generated list of classnames.
 *
 * When classnames in the app changes, you can remove the list for it to regenerate.
 */

class ClassnameGenerator {
  state = [0];
  CHARS = "_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";
  next() {
    this.state[this.state.length - 1] += 1;
    for (let i = this.state.length - 1; i; i--) {
      if (this.state[i] === 64) {
        this.state[i] = 0;
        this.state[i - 1] += 1;
      }
    }
    // note class name cannot start with digit or dash
    if (this.state[0] === 53) {
      this.state[0] = 0;
      this.state.unshift(0);
    }
    return this.state.map((d) => this.CHARS[d]).join("");
  }
}

class ClassnameStore {
  private nameGenerator = new ClassnameGenerator();
  private nameMap = new Map();
  private classnames: string[] = [];
  private loaded = new Set<string>();
  private visited = new Set<string>();

  private generating = false;
  private sessions = 0;

  init(storeFileName: string) {
    if (this.sessions === 0) {
      if (fs.existsSync(storeFileName)) {
        JSON.parse(fs.readFileSync(storeFileName, "utf8")).forEach(
          (name: string) => {
            if (!this.nameMap.has(name)) {
              this.nameMap.set(name, this.nameGenerator.next());
              this.classnames.push(name);
              this.loaded.add(name);
            } else {
              console.warn(
                `Found duplicated class names from {this.storeFileName}, please regenerate by removing ${storeFileName}.`
              );
            }
          }
        );
      } else {
        this.generating = true;
      }
    }
    this.sessions += 1;
  }

  getName(name: string) {
    if (!this.nameMap.has(name)) {
      this.nameMap.set(name, this.nameGenerator.next());
      this.classnames.push(name);
    }
    this.visited.add(name);
    return this.nameMap.get(name);
  }

  finalize(storeFileName: string) {
    this.sessions -= 1;
    if (this.sessions === 0) {
      const deleted = Array.from(this.loaded).filter(
        (name) => !this.visited.has(name)
      );
      if (this.generating) {
        console.log(`saving all class name into ${storeFileName}.`);
      } else if (deleted.length > 0) {
        console.log(
          "\x1b[1m",
          "\x1b[33m",
          `${deleted.length} class names including "${deleted[0]}" have been removed from the list, you can regenerate the list by removing ${storeFileName}.`,
          "\x1b[0m"
        );
      }
      fs.writeFileSync(storeFileName, JSON.stringify(this.classnames, null, 2));
    }
  }
}

const store = new ClassnameStore();

function getReadableCSSModuleLocalIdent(
  context: unknown,
  localIdentName: unknown,
  localName: string,
  options: unknown
) {
  return loaderUtils
    .interpolateName(context, "[path][name]__" + localName, options)
    .replace(/\./g, "_");
}

function getMinimalCSSModuleLocalIdent(
  context: unknown,
  localIdentName: unknown,
  localName: string,
  options: unknown
) {
  if (store == null) {
    throw new Error(
      `CssModuleClassNameMinifierPlugin is not initialized, make sure to include the plugin in your webpack configuration.`
    );
  }
  const codeName = loaderUtils.interpolateName(
    context,
    "[path][name]__" + localName,
    options
  );
  return store.getName(codeName);
}

let getLocalIdent = getMinimalCSSModuleLocalIdent;

type Options = {
  storeFilename?: string;
  minify?: boolean;
};

export class CssModuleClassNameMinifierPlugin {
  constructor(private options?: Options) {}

  apply(compiler: webpack.Compiler) {
    const storeFileName = this.options?.storeFilename ?? "classnames.json";
    const minify =
      this.options?.minify ?? compiler.options.mode !== "development";

    if (minify) {
      compiler.hooks.environment.tap("CssModuleClassNameMinifierPlugin", () => {
        store.init(storeFileName);
      });

      compiler.hooks.done.tap("CssModuleClassNameMinifierPlugin", () => {
        store.finalize(storeFileName);
      });
      getLocalIdent = getMinimalCSSModuleLocalIdent;
    } else {
      getLocalIdent = getReadableCSSModuleLocalIdent;
    }
  }

  static getLocalIdent(
    context: unknown,
    localIdentName: unknown,
    localName: string,
    options: unknown
  ) {
    return getLocalIdent(context, localIdentName, localName, options);
  }
}
