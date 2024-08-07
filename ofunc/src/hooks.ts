import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts, { factory } from "typescript";
import { fileURLToPath } from "url";

type Format = "builtin" | "commonjs" | "dynamic" | "json" | "module" | "wasm";

interface LoadContext {
  conditions: string[];
  format: string | null | undefined;
  importAttributes: object;
}

interface LoadReturn {
  format?: Format | null;
  shortCircuit?: boolean;
  source: string | ArrayBuffer;
}

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
                    lhs.expression
                  ),
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_args"),
                    undefined,
                    undefined,
                    factory.createArrayLiteralExpression([...node.arguments], false)
                  ),
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_method"),
                    undefined,
                    undefined,
                    factory.createPropertyAccessExpression(factory.createIdentifier("$_obj"), lhs.name)
                  ),
                ],
                ts.NodeFlags.Const
              )
            ),
            factory.createReturnStatement(
              factory.createCallExpression(factory.createIdentifier("$_obu_log"), undefined, [
                factory.createIdentifier("$_obj"),
                factory.createIdentifier("$_method"),
                factory.createIdentifier("$_args"),
              ])
            ),
          ],
          false
        )
      )
    ),
    undefined,
    []
  );
};

/**
 * Instruments an `("any expr")["any expr"]()` call with a call to `$_obu_log`.
 */
const instrumentIndirectFunction = (node: ts.CallExpression, lhs: ts.ElementAccessExpression) => {
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
                    lhs.expression
                  ),
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_prop"),
                    undefined,
                    undefined,
                    lhs.argumentExpression
                  ),
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_args"),
                    undefined,
                    undefined,
                    factory.createArrayLiteralExpression([...node.arguments], false)
                  ),
                  factory.createVariableDeclaration(
                    factory.createIdentifier("$_method"),
                    undefined,
                    undefined,
                    factory.createElementAccessExpression(
                      factory.createIdentifier("$_obj"),
                      factory.createIdentifier("$_prop")
                    )
                  ),
                ],
                ts.NodeFlags.Const
              )
            ),
            factory.createReturnStatement(
              factory.createCallExpression(factory.createIdentifier("$_obu_log"), undefined, [
                factory.createIdentifier("$_obj"),
                factory.createIdentifier("$_method"),
                factory.createIdentifier("$_args"),
              ])
            ),
          ],
          false
        )
      )
    ),
    undefined,
    []
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
        factory.createBlock([
          factory.createVariableStatement(
            [],
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  factory.createIdentifier("$_args"),
                  undefined,
                  undefined,
                  factory.createArrayLiteralExpression([...node.arguments])
                ),
                factory.createVariableDeclaration(
                  factory.createIdentifier("$_method"),
                  undefined,
                  undefined,
                  node.expression
                ),
              ],
              ts.NodeFlags.Const
            )
          ),
          factory.createReturnStatement(
            factory.createCallExpression(factory.createIdentifier("$_obu_log"), undefined, [
              factory.createIdentifier("undefined"),
              factory.createIdentifier("$_method"),
              factory.createIdentifier("$_args"),
            ])
          ),
        ])
      )
    ),
    undefined,
    []
  );
};

function transformNode(node: ts.Node): ts.Node {
  node = ts.visitEachChild(node, transformNode, undefined);

  if (ts.isCallExpression(node)) {
    // Instrument direct method calls and calls on variables
    if (ts.isPropertyAccessExpression(node.expression)) {
      return instrumentFunction(node, node.expression);
    } else if (ts.isElementAccessExpression(node.expression)) {
      return instrumentIndirectFunction(node, node.expression);
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

const injectedSource = fs
  .readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "injected.js"), { encoding: "utf-8" })
  .replace("export {};", "")
  .replaceAll(/\/\/.*?$/gm, "")
  .replaceAll(/\s{2,}/gm, " ")
  .replace(/^\s*/, "");

const instrumentSource = (src: string): string => {
  const sourceFile = ts.createSourceFile("temp.ts", src, ts.ScriptTarget.Latest, true);

  const result = transformSourceFile(sourceFile);
  if (result === undefined) {
    return src;
  }

  const printer = ts.createPrinter();
  const newCode = printer.printNode(ts.EmitHint.Unspecified, result, sourceFile);

  return injectedSource + newCode;
};

export async function load(
  url: string,
  context: LoadContext,
  nextLoad: (url: string, context: LoadContext) => Promise<LoadReturn>
): Promise<LoadReturn> {
  if (process.env.DEBUG) {
    console.log(`Loading URL: ${url}\n`);
  }

  const r = await nextLoad(url, context);

  if (!r.source && url.startsWith("file://")) {
    const filePath = fileURLToPath(url);
    r.source = fs.readFileSync(filePath, "utf-8");
  }

  if (r.source && url.endsWith(".js")) {
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
      console.error("Error parsing or processing the TypeScript code:", error);
      throw error;
    }
  } else {
    console.error("No source code found for URL:", url);
  }

  return r;
}
