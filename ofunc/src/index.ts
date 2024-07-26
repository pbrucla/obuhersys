import fs from 'node:fs';
import path from 'node:path';
import ts, { factory } from 'typescript';

type Format = 'builtin' | 'commonjs' | 'dynamic' | 'json' | 'module' | 'wasm';

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
  nextLoad: (url: string, context: LoadContext) => Promise<LoadReturn>
) => Promise<LoadReturn>;

type GlobalPreloadHook = () => string;

/**
 * Instruments a call expression with a call to log() to record method and arguments.
 *
 * So far, this will only work on x.y(a1, a2, ...).
 * TODO We need to come up with a solution for tracking:
 *  const fn = x.y;
 *  fn(a1, a2);
 * See footnote.
 *
 * Example:
 *
 * crypto.randomBytes(8)
 *
 * will be transformed to
 *
 * (() => {
 *   var args = [8];
 *   log(crypto, "randomBytes", args);
 *   return crypto.randomBytes(...args);
 * })();
 *
 * Breakdown:
 *  1. wrap in an anonymous lambda expression;
 *     this creates a function with the body inside of { } and then
 *     immediately calls it;
 *     we do this because the transformed code is still a CallExpression
 *     so we don't have to worry about constructing an incorrect syntax tree
 *  2. store the arguments into an array to avoid re-evaluation.
 *  3. call log with the object, its method name, and the args array
 *     (we log the object because we want to track order of methods called on object)
 *  4. perform the original call using the saved args and then return the result
 *
 * Footnote:
 * Perhaps to support a raw function call, we could instrument that code to
 *  const fn = propAccess(x, x.y);
 *  (() => {
 *    var args = [a1, a2];
 *    logFn(fn, args);
 *    return fn(...args);
 *  })();
 * And then propAccess can set y[Symbol('[[obu]]')] = { obj: x, meth: 'y' }.
 * And then logFn reads the secret key to find the object and method.
 */
const addLog = (callexpr: ts.CallExpression) => {
  if (ts.isPropertyAccessExpression(callexpr.expression)) {
    return __addLog(
      [...callexpr.arguments],
      callexpr.expression.expression,
      callexpr.expression.name,
      callexpr
    );
  }
  return callexpr;
};

// below tree acquired from
// https://ts-ast-viewer.com/#code/BTCUAIF4D5wb3AYwPYDsDOAXcBDATgObpTgDaAHALoDc4ANsgcIngJ4AOmyANOAOR4cqACbIAtgCFWmAKbo+vfEVC08MzAFc8qJG07IAdIJHips9MANWl6FeAC+oMNSA
const __addLog = (
  args: ts.Expression[],
  obj: ts.Expression,
  prop: ts.Node,
  callexpr: ts.CallExpression
) =>
  factory.createCallExpression(
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
              // empty means just var
              // factory.createToken(SyntaxKind.ConstKeyword) will create a const
              // however if that is supplied, we end up with a `const var` which is wrong
              [],
              factory.createVariableDeclarationList(
                [
                  factory.createVariableDeclaration(
                    factory.createIdentifier('$_args'),
                    undefined,
                    undefined,
                    factory.createArrayLiteralExpression(
                      // [factory.createNumericLiteral("8")],
                      args,
                      false
                    )
                  ),
                ]
                // ts.NodeFlags.Const | ts.NodeFlags.Constant | ts.NodeFlags.Constant
                // above argument was outputted by the ts-ast site, however
                // above is not supported in new typescript version, use first argument
                // of ModifierLike[] to change type of var
              )
            ),
            factory.createExpressionStatement(
              factory.createCallExpression(
                factory.createIdentifier('$_obu_log'),
                undefined,
                [
                  // factory.createIdentifier("crypto"),
                  obj,
                  // factory.createStringLiteral("randomBytes"),
                  factory.createStringLiteral(prop.getText()),
                  factory.createIdentifier('$_args'),
                ]
              )
            ),
            factory.createReturnStatement(
              factory.updateCallExpression(
                callexpr,
                callexpr.expression,
                callexpr.typeArguments,
                [
                  factory.createSpreadElement(
                    factory.createIdentifier('$_args')
                  ),
                ]
              )
            ),
          ],
          false
        )
      )
    ),
    undefined,
    []
  );

function transformSourceFile(sourceFile: ts.SourceFile) {
  function visitor(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      // only instrument function calls
      return [addLog(node)];
    }
    return ts.visitEachChild(node, visitor, undefined);
  }

  const context = {
    factory: ts.factory,
  };

  return ts.visitNode(sourceFile, visitor);
}

const instrumentSource = (src: string): string => {
  // parse src into typescript, name file temp.ts
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    src,
    ts.ScriptTarget.Latest,
    true
  );

  // add calls to log to each function call
  const result = transformSourceFile(sourceFile);
  if (result === undefined) {
    return src;
  }

  // convert our modified syntax tree to javascript sourcecode
  const printer = ts.createPrinter();
  const newCode = printer.printNode(
    ts.EmitHint.Unspecified,
    result,
    sourceFile
  );
  return newCode;
};

/**
 * This hook decides what code to load for a javascript file.
 */
export const load: LoadHook = async function (url, context, nextLoad) {
  if (process.env.DEBUG) {
    console.log(`Loading URL: ${url}`);
  }
  const r = await nextLoad(url, context);

  if (!r.source && url.startsWith('file://')) {
    const filePath = urlToPath(url);
    r.source = fs.readFileSync(filePath, 'utf-8');
  }

  if (r.source) {
    try {
      const sourceCode = r.source.toString();

      const newSource = instrumentSource(sourceCode);
      // run
      // export DEBUG=yes
      // before running this script to see this output
      if (process.env.DEBUG) {
        console.log('start src---');
        console.log(newSource);
        console.log('------------');
      }
      r.source = newSource;
      r.shortCircuit = true;
    } catch (error) {
      console.error('Error parsing or processing the TypeScript code:', error);
    }
  } else {
    console.error('No source code found for URL:', url);
  }

  return r;
};

// this is code to prepare the globalThis object
// i don't think common functions like require exist at
// the stage this code runs so it's probably not worth
export const globalPreload: GlobalPreloadHook = function () {
  return `
    globalThis['$obu_log'] = (obj, methodname, args) => {
      // some code to log what was called
    };
    `
};

function urlToPath(url: string): string {
  const fileUrl = new URL(url);
  return path.normalize(fileUrl.pathname);
}
