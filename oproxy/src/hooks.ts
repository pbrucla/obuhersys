import { Comment, Node as AcornNode, Parser, Program as AcornProgram } from 'acorn';
import * as walk from 'acorn-walk';
import { Program } from 'estree';
import { attachComments } from 'estree-util-attach-comments';
import { toJs } from 'estree-util-to-js';
import path from 'node:path';
import fs from 'node:fs';
import { SourceMapGenerator } from 'source-map';
import { fileURLToPath, pathToFileURL } from 'url';

const UNWRAP_NAMESPACE_PLS = '__damn_unwrap_namespace_pls';

export async function initialize(data: any) {
  // Receives data from `register`.
}

interface LoadReturn {
  format: string;
  shortCircuit: boolean | undefined;
  source:
    | string
    | ArrayBuffer
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array
    | BigInt64Array
    | BigUint64Array;
}

export async function load(
  url: string,
  context: {
    conditions: string[];
    format: string | null | undefined;
    importAttributes: object;
  },
  nextLoad: (url: string, context: object) => Promise<LoadReturn>
): Promise<LoadReturn> {
  // Take a resolved URL and return the source code to be evaluated.
  const r = await nextLoad(url, context);

  if (!r.source && url.startsWith('file://')) {
    const filePath = fileURLToPath(url);
    r.source = fs.readFileSync(filePath, 'utf-8');
  }

  if (new URL(url).pathname.split('/').at(-2) == 'proxymodules') {
    // Don't modify if it's the proxy module importing the original module, avoid circular import
    // console.log(`loading proxy ${url}\n`);
    r.format = 'commonjs';
    return r;
  } else {
    // console.log(`loading module ${url}\n`);
  }

  // convert TypedArray to a ArrayBuffer
  if (
    r.source instanceof Int8Array ||
    r.source instanceof Uint8Array ||
    r.source instanceof Uint8ClampedArray ||
    r.source instanceof Int16Array ||
    r.source instanceof Uint16Array ||
    r.source instanceof Int32Array ||
    r.source instanceof Uint32Array ||
    r.source instanceof Float32Array ||
    r.source instanceof Float64Array ||
    r.source instanceof BigInt64Array ||
    r.source instanceof BigUint64Array
  ) {
    r.source = r.source.buffer;
  }

  if (r.source instanceof ArrayBuffer) {
    // force r.source to be a string
    r.source = new TextDecoder().decode(r.source);
  }

  const comments: Comment[] = [];
  const ast = Parser.parse(r.source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    locations: true,
    onComment: comments,
  });
  attachComments(ast as Program, comments);

  const specifierFixupVisitors: walk.SimpleVisitors<string[]> = {
    ImportDefaultSpecifier(node) {
      // console.log(`found ImportDefaultSpecifier ${node.local.name}`);
    },

    ImportNamespaceSpecifier(node, state) {
      // console.log(`found ImportNamespaceSpecifier ${node.local.name}`);
      state.push(node.local.name);
      node.local.name += UNWRAP_NAMESPACE_PLS;
    },
  };

  walk.simple(ast, {
    ImportDeclaration(node) {
      // console.log(`found ImportDeclaration ${node.source.value}`);
      let needsSpecifierFixup = true;
      switch (node.source.value) {
        case 'crypto':
        case 'node:crypto':
          node.source.raw = JSON.stringify(resolveProxy('cryptoLogProxy.js'));
          break;
        default:
          needsSpecifierFixup = false;
          break;
      }
      if (needsSpecifierFixup) {
        const toUnwrap: string[] = [];
        walk.simple(node, specifierFixupVisitors, undefined, toUnwrap);
        unwrapNamespaceImports(ast, node, toUnwrap);
      }
    },

    // ImportExpression(node) {
    //   console.log(`found ImportExpression ${node.source}`)
    // }
  });

  let js = toJs(ast as Program, { filePath: url, SourceMapGenerator });
  // r.source = 
  // r.source = js.value + '\n//# sourceMappingURL=data:application/json;base64,' + btoa(JSON.stringify(js.map));
  // console.log(
  //   `patched r.source:\n\n${js.value
  //     .split('\n')
  //     .map((x) => `    ${x}`)
  //     .join('\n')}\n`
  // );
  
  // Handle require, by prepending code to edit require cache
  const handleRequireCode = `
    require.cache ??= {};
    if (!('crypto' in require.cache)) {
      const __damn_node_crypto_proxy = require(${JSON.stringify(resolveProxy('cryptoLogProxy.js'))});
      require.cache["crypto"] = { id: 'crypto', path: 'stuff', exports: __damn_node_crypto_proxy, filename:'stuff.js', loaded: true, children: [], paths: []};
    }
  `;

  r.source = handleRequireCode + r.source;
  console.log(r.source);
  
  r.shortCircuit = true;
  return r;
}

function resolveProxy(module: string): string {
  const fileurl = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), 'proxymodules', module)).toString();
  return fileurl.slice(7);
}

function unwrapNamespaceImports(ast: AcornProgram, after: AcornNode, toUnwrap: string[]) {
  const source = {
    start: after.start,
    end: after.end,
    range: after.range,
    loc: after.loc,
  };
  const index = ast.body.findIndex((x) => Object.is(x, after)) + 1;
  // console.log('inserting stuff at', index);
  toUnwrap.forEach((unwrapped) => {
    ast.body.splice(index, 0, {
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: unwrapped,
            ...source,
          },
          init: {
            type: 'MemberExpression',
            object: {
              type: 'Identifier',
              name: unwrapped + UNWRAP_NAMESPACE_PLS,
              ...source,
            },
            property: {
              type: 'Identifier',
              name: 'default',
              ...source,
            },
            computed: false,
            optional: false,
            ...source,
          },
          ...source,
        },
      ],
      ...source,
    });
  });
}
