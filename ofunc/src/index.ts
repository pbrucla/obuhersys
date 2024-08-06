import fs from "node:fs";
import process from "node:process";
import ts, { factory } from "typescript";
import { fileURLToPath } from "url";

type Format = "builtin" | "commonjs" | "dynamic" | "json" | "module" | "wasm";

interface LoadContext {
  conditions: string[];
  format?: Format | null;
  importAssertions?: Record<string, string>;
}

interface LoadReturn {
  format?: Format | null;
  shortCircuit?: boolean;
  source: string | ArrayBuffer;
}

type LoadHook = (
  url: string,
  context: LoadContext,
  nextLoad: (url: string, context: LoadContext) => Promise<LoadReturn>,
) => Promise<LoadReturn>;

/**
 * Instruments an `obj.foo()` call with a call to `$_obu_log`.
 */
const instrumentFunction = (node: ts.CallExpression, lhs: ts.PropertyAccessExpression) => {
  return factory.createCallExpression(
    factory.createParenthesizedExpression(
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock(
          [
            factory.createVariableStatement(
              [],
              factory.createVariableDeclarationList(
                [
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_obj"),
                    undefined,
                    undefined,
                    lhs.expression,
                  ),
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_args"),
                    undefined,
                    undefined,
                    factory.createArrayLiteralExpression([...node.arguments], false),
                  ),
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_method"),
                    undefined,
                    undefined,
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier("$_obj"),
                      lhs.name,
                    ),
                  ),
                ],
                ts.NodeFlags.Const,
              ),
            ),
            factory.createReturnStatement(
              factory.createCallExpression(
                factory.createIdentifier("$_obu_log"),
                undefined,
                [
                  factory.createIdentifier("$_obj"),
                  factory.createIdentifier("$_method"),
                  factory.createIdentifier("$_args"),
                ],
              )
            ),
          ],
          false,
        ),
      ),
    ),
    undefined,
    [],
  );
};

/**
 * Instruments an `("any expr")()` call with a call to `$_obu_log`.
 */
const instrumentConstructor = (node: ts.CallExpression) => {
  return factory.createCallExpression(
    factory.createParenthesizedExpression(
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock(
          [
            factory.createVariableStatement(
              [],
              factory.createVariableDeclarationList(
                [
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_args"),
                    undefined,
                    undefined,
                    factory.createArrayLiteralExpression([...node.arguments]),
                  ),
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_method"),
                    undefined,
                    undefined,
                    node.expression,
                  ),
                ],
                ts.NodeFlags.Const,
              ),
            ),
            factory.createReturnStatement(
              factory.createCallExpression(
                factory.createIdentifier("$_obu_log"),
                undefined,
                [
                  factory.createIdentifier("$_method"),
                  factory.createIdentifier("$_method"),
                  factory.createIdentifier("$_args"),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
    undefined,
    [],
  );
};

function transformNode(node: ts.Node): ts.Node {
  node = ts.visitEachChild(node, transformNode, undefined);

  if (ts.isCallExpression(node)) {
    // Instrument direct method calls and calls on variables
    if (ts.isPropertyAccessExpression(node.expression)) {
      return instrumentFunction(node, node.expression);
    } else {
      return instrumentConstructor(node);
    }
  } else {
    return node;
  }
}

function transformSourceFile(sourceFile: ts.SourceFile) {
  return ts.visitNode(sourceFile, transformNode);
}

const instrumentSource = (src: string): string => {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    src,
    ts.ScriptTarget.Latest,
    true,
  );

  const result = transformSourceFile(sourceFile);
  if (result === undefined) {
    return src;
  }

  const printer = ts.createPrinter();
  const newCode = printer.printNode(
    ts.EmitHint.Unspecified,
    result,
    sourceFile,
  );

  const logFunction = `
    (() => {
      const obu_context = Symbol.for("[[obu_context]]");
      const obu_constructed = Symbol.for("[[obu_constructed]]");
      const appendFileSync = require("node:fs").appendFileSync;
      const logFile = \`./logs/cryptoLog.log\`;

      let $_obu_counter = 0;

      globalThis['$_obu_log'] = function(obj, method, args) {
        const ctx = method?.[obu_context];
        if (ctx) {
          const isConstructor = ctx.length === 3 && ctx[2] === true;
          const id = isConstructor ? $_obu_counter++ : null;
          try {
            appendFileSync(logFile, JSON.stringify({
              id,
              type: isConstructor ? "constructor" : "function",
              fn: ctx[1],
              objName: ctx[1],
              target: ctx[0],
              args,
            }) + "\\n");
          } catch {}
          const ret = method.apply(obj, args);
          if (isConstructor && ret !== undefined && ret !== null && typeof ret === "object") {
            ret[obu_constructed] = id;
          }
          return ret;
        } else {
          const constructed = obj?.[obu_constructed];
          if(constructed !== undefined) {
            try {
              appendFileSync(logFile, JSON.stringify({
                id: constructed,
                type: "function",
                fn: method.name,
                target: obj,
                args,
              }) + "\\n");
            } catch {}
          }
          return method.apply(obj, args);
        }
      };

      function $_obu_mark(obj, context, name) {
        if (obj !== null && obj !== undefined && (typeof obj === "object" || typeof obj === "function") && !Object.hasOwn(obj, obu_context)) {
          obj[obu_context] = [context, name];
          for (const k in obj) {
            if (k != obu_context) {
              $_obu_mark(obj[k], context, k);
            }
          }
        }
      }

      const _crypto = require("crypto");
      $_obu_mark(_crypto, "crypto", undefined);
      const cryptoConstructors = ["createCipheriv", "createDecipheriv", "createHash", "pbkdf2"];
      for (const ctor of cryptoConstructors) {
        _crypto[ctor][obu_context].push(true);
      }
    })();
  `
    .replace(/^\s*/, "")
    .replaceAll(/\s{2,}/gm, " ");

  return logFunction + newCode;
};

export const load: LoadHook = async function (url, context, nextLoad) {
  // TODO: for some reason node only prints the first flush in the global preload hook ???
  process.stdout.cork();
  try {
    if (process.env.DEBUG) {
      console.log(`Loading URL: ${url}\n`);
    }

    const r = await nextLoad(url, context);

    if (!r.source && url.startsWith("file://")) {
      const filePath = fileURLToPath(url);
      r.source = fs.readFileSync(filePath, "utf-8");
    }

    if (r.source && url.endsWith('.js')) {
      try {
        const sourceCode = r.source.toString();

        const newSource = instrumentSource(sourceCode);
        if (process.env.DEBUG) {
          console.log("start src---");
          console.log(newSource);
          console.log("------------");
        }
        r.source = newSource;
        r.shortCircuit = true;
      } catch (error) {
        console.error(
          "Error parsing or processing the TypeScript code:",
          error,
        );
        throw error;
      }
    } else {
      console.error("No source code found for URL:", url);
    }

    return r;
  } finally {
    process.stdout.uncork();
    process.stdout.end();
  }
};
