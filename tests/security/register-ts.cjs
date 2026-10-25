// Lets `node --test` load the project's TypeScript modules (no extra test runner needed): transpiles .ts on require.
const ts = require("typescript");
const fs = require("node:fs");

require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(outputText, filename);
};
