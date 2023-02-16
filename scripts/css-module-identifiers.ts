import loaderUtils from "loader-utils";

class ClassnameGenerator {
  state = [0, 0];
  CHARS = "_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";
  next() {
    this.state[this.state.length - 1] += 1;
    for (let i = this.state.length - 1; i; i--) {
      if (this.state[i] === 64) {
        this.state[i] = 0;
        this.state[i - 1] += 1;
      }
    }
    if (this.state[0] === 53) {
      this.state[0] = 0;
      this.state.unshift(0);
    }
    return this.state.map((d) => this.CHARS[d]).join("");
  }
}

export function getReadableCSSModuleLocalIdent(
  context: unknown,
  localIdentName: unknown,
  localName: string,
  options: unknown
) {
  return loaderUtils
    .interpolateName(context, "[path][name]__" + localName, options)
    .replace(/\./g, "_");
}

const nameGenerator = new ClassnameGenerator();
const nameMap = new Map();
export function getMinimalCSSModuleLocalIdent(
  context: unknown,
  localIdentName: unknown,
  localName: string,
  options: unknown
) {
  const codeName = loaderUtils.interpolateName(
    context,
    "[path][name]__" + localName,
    options
  );
  if (!nameMap.has(codeName)) {
    nameMap.set(codeName, nameGenerator.next());
  }
  return nameMap.get(codeName);
}
