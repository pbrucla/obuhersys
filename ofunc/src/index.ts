import fs from 'node:fs';
import ts from 'typescript';

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

export const load: LoadHook = async function (url, context, nextLoad) {
  const r = await nextLoad(url, context);
  // if (context.format === "module" && r.source) {
  //   r.source = compile(config.wrapperName, r.source.toString());
  // }
  return r;
};

export const globalPreload: GlobalPreloadHook = function () {
  // const jsonConfig = JSON.stringify(config);
  // const root = JSON.stringify(__dirname);
  // return `globalThis.${config.wrapperName} = (${agent})(${root}, ${jsonConfig});`;
  return '';
};


function addFunctionLogging(source: string): string {
  const sourceFile = ts.createSourceFile(
    'tempFile.ts',
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
  );

  const printer = ts.createPrinter();
  const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isMethodDeclaration(node)) {
        const functionName = node.name ? node.name.getText() : '<anonymous>';
        const logStatement = ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createIdentifier('console.log'),
            undefined,
            [ts.factory.createStringLiteral(`Function name: ${functionName}`)]
          )
        );
        
        if (node.body && ts.isBlock(node.body)) {
          const newStatements = ts.factory.createNodeArray([
            logStatement,
            ...node.body.statements
          ]);
          const newBody = ts.factory.updateBlock(node.body, newStatements);
          if (ts.isFunctionDeclaration(node)) {
            return ts.factory.updateFunctionDeclaration(
              node,
              node.modifiers,
              node.asteriskToken,
              node.name,
              node.typeParameters,
              node.parameters,
              node.type,
              newBody
            );
          } else if (ts.isFunctionExpression(node)) {
            return ts.factory.updateFunctionExpression(
              node,
              node.modifiers,
              node.asteriskToken,
              node.name,
              node.typeParameters,
              node.parameters,
              node.type,
              newBody
            );
          } else if (ts.isMethodDeclaration(node)) {
            return ts.factory.updateMethodDeclaration(
              node,
              node.decorators,
              node.modifiers,
              node.asteriskToken,
              node.name,
              node.questionToken,
              node.typeParameters,
              node.parameters,
              node.type,
              newBody
            );
          }
        }
      }
      return ts.visitEachChild(node, visit, context);
    };

    return (node) => ts.visitNode(node, visit);
  };

  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0];

  const transformedSource = printer.printFile(transformedSourceFile);
  result.dispose();

  return transformedSource;
}