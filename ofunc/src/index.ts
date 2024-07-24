import fs from 'node:fs';
import path from 'node:path';
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

function transformSourceFile(sourceFile: ts.SourceFile) {
  function visitor(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      return ts.factory.updateCallExpression(
        node,
        ts.factory.createIdentifier('foo'),
        node.typeArguments,
        node.arguments
      );
    }
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
