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

function getFunctionNames(sourceCode: string): string[] {
  const sourceFile = ts.createSourceFile('temp.ts', sourceCode, ts.ScriptTarget.Latest, true);
  const functionNames: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      functionNames.push(node.name.getText());
    } else if (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      if (node.parent && ts.isVariableDeclaration(node.parent) && node.parent.name) {
        functionNames.push(node.parent.name.getText());
      } else if (node.parent && ts.isPropertyAssignment(node.parent) && ts.isIdentifier(node.parent.name)) {
        functionNames.push(node.parent.name.getText());
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return functionNames;
}

export const load: LoadHook = async function (url, context, nextLoad) {
  console.log(`Loading URL: ${url}`);
  const r = await nextLoad(url, context);

  if (!r.source && url.startsWith('file://')) {
    const filePath = urlToPath(url);
    console.log("\n");
    console.log(filePath);
    console.log("\n");
    r.source = fs.readFileSync(filePath, 'utf-8');
  }

  if (r.source) {
    try {
      const sourceCode = r.source.toString();
      console.log(`Source code for ${url}: \n${sourceCode}`);
      const functionNames = getFunctionNames(sourceCode);
      console.log('Function names:', functionNames.join(', '));
    } catch (error) {
      console.log("hio");
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
