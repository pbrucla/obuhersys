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

type GlobalPreloadHook = () => string;

/**
 * Instruments a call expression with a call to log() to record method and arguments.
 */
const addLog = (
  callexpr: ts.CallExpression,
  obj: ts.Expression | undefined,
  methodName: string | undefined,
) => {
  if (!methodName && ts.isPropertyAccessExpression(callexpr.expression)) {
    methodName = callexpr.expression.name.getText();
    obj = callexpr.expression.expression;
  }
  const args = [...callexpr.arguments];

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
                    factory.createArrayLiteralExpression(args, false),
                  ),
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_method"),
                    undefined,
                    undefined,
                    callexpr.expression,
                  ),
                ],
                ts.NodeFlags.Const,
              ),
            ),
            factory.createReturnStatement(
              methodName && obj
                ? factory.createCallExpression(
                  factory.createIdentifier("$_obu_log"),
                  undefined,
                  [
                    obj,
                    factory.createStringLiteral(methodName),
                    factory.createIdentifier("$_method"),
                    factory.createIdentifier("$_args"),
                  ],
                )
                : factory.updateCallExpression(
                  callexpr,
                  factory.createIdentifier("$_method"),
                  callexpr.typeArguments,
                  [
                    factory.createSpreadElement(
                      factory.createIdentifier("$_args"),
                    ),
                  ],
                ),
            ),
          ].filter((node) => node !== undefined) as ts.Statement[],
          false,
        ),
      ),
    ),
    undefined,
    [],
  );
};

const instrumentVariableCall = (node: ts.CallExpression) => {
  const expr = node.expression;

  const symbolKey = factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier("Symbol"),
      "for",
    ),
    undefined,
    [factory.createStringLiteral("[[obu]]")],
  );

  const contextVar = factory.createVariableDeclaration(
    factory.createIdentifier("$_context"),
    undefined,
    undefined,
    factory.createLogicalAnd(
      factory.createIdentifier(expr.getText()),
      factory.createElementAccessExpression(
        factory.createIdentifier(expr.getText()),
        symbolKey,
      ),
    ),
  );

  const argsVar = factory.createVariableDeclaration(
    factory.createIdentifier("$_args"),
    undefined,
    undefined,
    factory.createArrayLiteralExpression([...node.arguments]),
  );

  const updatedNode = factory.createBlock(
    [
      factory.createVariableStatement(
        [],
        factory.createVariableDeclarationList(
          [contextVar, argsVar],
          ts.NodeFlags.Const,
        ),
      ),
      factory.createReturnStatement(
        factory.createCallExpression(
          factory.createIdentifier("$_obu_log"),
          undefined,
          [
            factory.createIdentifier("$_context"),
            factory.createStringLiteral(expr.getText()),
            node.expression,
            factory.createIdentifier("$_args"),
          ],
        ),
      ),
    ],
  );

  return factory.createCallExpression(
    factory.createParenthesizedExpression(
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        updatedNode,
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
    if (ts.isIdentifier(node.expression)) {
      return instrumentVariableCall(node);
    } else {
      return addLog(node, undefined, undefined);
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
      const appendFileSync = require("node:fs").appendFileSync;
      const logFile = \`./logs/cryptoLog.log\`;

      let $_obu_counter = 0;

      globalThis['$_obu_log'] = function(obj, methodName, method, args) {
        const ctx = obj?.[Symbol.for("[[obu]]")];
        if (ctx) {
          const id = $_obu_counter++;
          try {
            appendFileSync(logFile, JSON.stringify({
              id: id,
              type: "constructor",
              objName: methodName,
              target: ctx,
              args,
            }) + "\\n");
          } catch {}
          const ret = method.bind(obj)(...args);
          if (ret !== undefined && ret !== null && typeof ret === "object") {
            ret[Symbol.for("[[obu_constructed]]")] = id;
          }
          return ret;
        } else {
          if(obj?.[Symbol.for("[[obu_constructed]]")] !== undefined) {
            try {
              appendFileSync(logFile, JSON.stringify({
                id: obj?.[Symbol.for("[[obu_constructed]]")],
                type: "function",
                fn: methodName,
                target: obj,
                args,
              }) + "\\n");
            } catch {}
          }
          return method.bind(obj)(...args);
        }
      };

      function $_obu_mark(obj, context) {
        if (obj !== null && obj !== undefined && typeof obj === "object") {
          obj[Symbol.for("[[obu]]")] = context;
          for (const k in obj) {
            $_obu_mark(obj[k], context);
          }
        }
      }

      $_obu_mark(require("crypto"), "crypto");
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

    if (r.source) {
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
