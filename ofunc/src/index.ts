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

const __addLog = (args: ts.Expression[], obj: ts.Expression, prop: ts.Node, callexpr: ts.CallExpression) => factory.createCallExpression(
  factory.createParenthesizedExpression(factory.createArrowFunction(
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
            [factory.createVariableDeclaration(
              factory.createIdentifier("args"),
              undefined,
              undefined,
              factory.createArrayLiteralExpression(
                // [factory.createNumericLiteral("8")],
                args,
                false
              )
            )],
            // ts.NodeFlags.Const | ts.NodeFlags.Constant | ts.NodeFlags.Constant
            // above is not supported in new typescript version, use first argument
            // of ModifierLike[] to change type of var
          )
        ),
        factory.createExpressionStatement(factory.createCallExpression(
          factory.createIdentifier("log"),
          undefined,
          [
            // factory.createIdentifier("crypto"),
            obj,
            // factory.createStringLiteral("randomBytes"),
            factory.createStringLiteral(prop.getText()),
            factory.createIdentifier("args")
          ]
        )),
        factory.createReturnStatement(factory.updateCallExpression(
          callexpr,
          callexpr.expression,
          callexpr.typeArguments, 
          [factory.createSpreadElement(factory.createIdentifier("args"))]
        ))
      ],
      false
    )
  )),
  undefined,
  []
);

function transformSourceFile(sourceFile: ts.SourceFile) {
  function visitor(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      // console.log('owo', node.expression.getText());
      return [addLog(node)];
      // return [node];
      // return ts.factory.updateCallExpression(
      //   node,
      //   ts.factory.createIdentifier('foo'),
      //   node.typeArguments,
      //   node.arguments
      // );
    }
    console.log(node);
    return ts.visitEachChild(node, visitor, undefined);
  }

  const context = {
    factory: ts.factory,
  };

  return ts.visitNode(sourceFile, visitor);
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
  return newCode;
};

export const load: LoadHook = async function (url, context, nextLoad) {
  console.log(`Loading URL: ${url}`);
  const r = await nextLoad(url, context);
  console.log('test1');

  if (!r.source && url.startsWith('file://')) {
    const filePath = urlToPath(url);
    console.log('test2');
    r.source = fs.readFileSync(filePath, 'utf-8');
  }

  if (r.source) {
    try {
      const sourceCode = r.source.toString();

      // const calledMethods = getCalledMethods(sourceCode);
      const newSource = instrumentSource(sourceCode);
      console.log('start src---');
      console.log(newSource);
      console.log('------------');
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

export const globalPreload: GlobalPreloadHook = function () {
  return '';
};

function urlToPath(url: string): string {
  const fileUrl = new URL(url);
  return path.normalize(fileUrl.pathname);
}
