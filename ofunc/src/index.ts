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

function getCalledMethods(sourceCode: string): string[] {
  const sourceFile = ts.createSourceFile('temp.ts', sourceCode, ts.ScriptTarget.Latest, true);
  const calledMethods: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      if (ts.isPropertyAccessExpression(expression)) {
        calledMethods.push(expression.getText());
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return calledMethods;
}

export const load: LoadHook = async function (url, context, nextLoad) {
  console.log(`Loading URL: ${url}`);
  const r = await nextLoad(url, context);
  console.log("test1");

  if (!r.source && url.startsWith('file://')) {
    const filePath = urlToPath(url);
    console.log("test2");
    r.source = fs.readFileSync(filePath, 'utf-8');
  }

  if (r.source) {
    try {
      const sourceCode = r.source.toString();

      const calledMethods = getCalledMethods(sourceCode);
      console.log("test3");

      console.log('Called methods:', calledMethods.join(', '));
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
