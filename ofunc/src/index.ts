import fs from 'node:fs';
import path from 'node:path';
import process from "node:process";
import ts, { factory } from 'typescript';
import { fileURLToPath, pathToFileURL } from 'url';

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
 */
const addLog = (
  callexpr: ts.CallExpression,
  obj: ts.Expression | undefined,
  methodName: string | undefined
) => {
  if (!methodName && ts.isPropertyAccessExpression(callexpr.expression)) {
    methodName = callexpr.expression.name.getText();
    obj = callexpr.expression.expression;
  }
  console.log("\x1b[92mwrapping method\x1b[0m", methodName);

  return __addLog([...callexpr.arguments], obj, methodName, callexpr);
};

// Instrument direct call expressions
const __addLog = (
  args: ts.Expression[],
  obj: ts.Expression | undefined,
  methodName: string | undefined,
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
              [],
              factory.createVariableDeclarationList([
                factory.createVariableDeclaration(
                  factory.createIdentifier('$_args'),
                  undefined,
                  undefined,
                  factory.createArrayLiteralExpression(args, false)
                ),
              ])
            ),
            methodName && obj
              ? factory.createExpressionStatement(
                  factory.createCallExpression(
                    factory.createIdentifier('$_obu_log'),
                    undefined,
                    [
                      obj,
                      factory.createStringLiteral(methodName),
                      factory.createIdentifier('$_args'),
                    ]
                  )
                )
              : undefined,
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
          ].filter((node) => node !== undefined) as ts.Statement[],
          false
        )
      )
    ),
    undefined,
    []
  );

// Instrument variable assignments with method references
const instrumentAssignment = (assignment: ts.BinaryExpression) => {
  if (ts.isPropertyAccessExpression(assignment.right)) {
    const methodName = assignment.right.name.getText();
    const obj = assignment.right.expression;

    const symbolKey = factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('Symbol'),
        'for'
      ),
      undefined,
      [factory.createStringLiteral('[[obu]]')]
    );

    const methodObject = factory.createObjectLiteralExpression([
      factory.createPropertyAssignment('obj', obj),
      factory.createPropertyAssignment(
        'method',
        factory.createStringLiteral(methodName)
      ),
    ]);

    const newRight = factory.createBinaryExpression(
      assignment.right,
      factory.createToken(ts.SyntaxKind.EqualsToken),
      factory.createAssignment(
        factory.createElementAccessExpression(assignment.right, symbolKey),
        methodObject
      )
    );

    return factory.createBinaryExpression(
      assignment.left,
      assignment.operatorToken,
      newRight
    );
  }

  return assignment;
}

function transformNode(node: ts.Node): ts.Node {
  node = ts.visitEachChild(node, transformNode, undefined);

  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken
  ) {
    // Instrument assignments
    return instrumentAssignment(node);
  } else if (ts.isCallExpression(node)) {
    // Instrument direct method calls and calls on variables
    const expr = node.expression;
    if (ts.isIdentifier(expr)) {
      const symbolKey = factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier('Symbol'),
          'for'
        ),
        undefined,
        [factory.createStringLiteral('[[obu]]')]
      );

      const contextVar = factory.createVariableDeclaration(
        factory.createIdentifier('$_context'),
        undefined,
        undefined,
        factory.createLogicalAnd(
          factory.createIdentifier(expr.getText()),
          factory.createElementAccessExpression(
            factory.createIdentifier(expr.getText()),
            symbolKey
          )
        )
      );

      const logCall = factory.createExpressionStatement(
        factory.createCallExpression(
          factory.createIdentifier('$_obu_log'),
          undefined,
          [
            factory.createElementAccessExpression(
              factory.createIdentifier('$_context'),
              factory.createStringLiteral('obj')
            ),
            factory.createElementAccessExpression(
              factory.createIdentifier('$_context'),
              factory.createStringLiteral('method')
            ),
            factory.createIdentifier('$_args'),
          ]
        )
      );

      const argsVar = factory.createVariableDeclaration(
        factory.createIdentifier('$_args'),
        undefined,
        undefined,
        factory.createArrayLiteralExpression([...node.arguments])
      );

      const updatedNode = factory.createBlock(
        [
          factory.createVariableStatement(
            [],
            factory.createVariableDeclarationList(
              [contextVar, argsVar],
              ts.NodeFlags.Const
            )
          ),
          factory.createIfStatement(
            factory.createIdentifier('$_context'),
            logCall
          ),
          factory.createReturnStatement(
            factory.updateCallExpression(
              node,
              node.expression,
              node.typeArguments,
              [
                factory.createSpreadElement(
                  factory.createIdentifier('$_args')
                ),
              ]
            )
          ),
        ],
        true
      );

      return factory.createCallExpression(
        factory.createParenthesizedExpression(
          factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            updatedNode
          )
        ),
        undefined,
        []
      );
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
    'temp.ts',
    src,
    ts.ScriptTarget.Latest,
    true
  );

  const result = transformSourceFile(sourceFile);
  if (result === undefined) {
    return src;
  }

  const printer = ts.createPrinter();
  const newCode = printer.printNode(
    ts.EmitHint.Unspecified,
    result,
    sourceFile
  );

  const logFunction = `
    function $_obu_log(obj, method, args) {
      $_obu_log.appendFileSync($_obu_log.file, JSON.stringify({
        type: (obj === undefined ? "constructor" : "function"),
        ...(obj === undefined ? {} : { objName: obj }),
        fn: method,
        args,
      }) + "\\n");
    }
    $_obu_log.appendFileSync = require("node:fs").appendFileSync;
    $_obu_log.file = \`./logs/cryptoLog.log\`;
    Object.freeze($_obu_log);
  `;

  return logFunction + '\n' + newCode;
};

export const load: LoadHook = async function (url, context, nextLoad) {
  // TODO: for some reason node only prints the first flush in the global preload hook ???
  process.stdout.cork();
  try {
    if (process.env.DEBUG) {
      console.log(`Loading URL: ${url}\n`);
    }

    const r = await nextLoad(url, context);

    if (!r.source && url.startsWith('file://')) {
      const filePath = fileURLToPath(url);
      r.source = fs.readFileSync(filePath, 'utf-8');
    }

    if (r.source) {
      try {
        const sourceCode = r.source.toString();

        const newSource = instrumentSource(sourceCode);
        if (process.env.DEBUG) {
          console.log('start src---');
          console.log(newSource);
          console.log('------------');
        }
        r.source = newSource;
        r.shortCircuit = true;
      } catch (error) {
        console.error('Error parsing or processing the TypeScript code:', error);
        throw error;
      }
    } else {
      console.error('No source code found for URL:', url);
    }

    return r;
  } finally {
    process.stdout.uncork();
    process.stdout.end();
  }
};

export const globalPreload: GlobalPreloadHook = function () {
  return `
    globalThis['$obu_log'] = (obj, methodname, args) => {
      // some code to log what was called
    };
    `;
};

