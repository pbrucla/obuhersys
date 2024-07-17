import { Parser } from "acorn";
import * as walk from "acorn-walk"; 
import * as astring from "astring";

export async function initialize(data: any) {
  // Receives data from `register`.
}

interface ResolveReturn {
  format: string | null | undefined;
  importAttributes: object | undefined;
  shortCircuit: boolean | undefined;
  url: string;
}

/*
export async function resolve(
  specifier: string,
  context: {
    conditions: string[];
    importAttributes: object;
    parentURL: string | undefined;
  },
  nextResolve: (specifier: string, context: object) => ResolveReturn
): Promise<ResolveReturn> {
  // Take an `import` or `require` specifier and resolve it to a URL.
}
*/

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

  console.log(`loading module ${url}`);

  if (new URL(url).pathname.split("/").at(-2) == "proxymodules") {
    // Don't modify if it's the proxy module importing the original module, avoid circular import
    r.format = "commonjs";
    return r;
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
  
  const ast = Parser.parse(r.source, {
    ecmaVersion: "latest",
    sourceType: "module",
  });
  // console.log('r.source\n', ast);

  walk.simple(ast, {
    // ImportDeclaration(node) {
    //   console.log(`found ImportDeclaration ${node.source.value}`)
    // // },
    ImportDeclaration(node) {
      console.log(`found ImportDeclaration ${node.source.value}`)
      switch(node.source.value) {
        case 'crypto':
        case 'node:crypto':
          console.log('found crypto import');
          node.source.raw = JSON.stringify('./proxymodules/cryptoProxy.js');
          break;
        default:
          break;
      }
    },

    ImportSpecifier(node) {
      console.log(`found ImportSpecifier ${node.local.name}`)
    },
    
    ImportDefaultSpecifier(node) {
      console.log(`found ImportDefaultSpecifier ${node.local.name}`)
    },
    
    // ImportNamespaceSpecifier(node) {
    //   console.log(`found ImportNamespaceSpecifier ${node.local.name}`)
    //   switch(node.local.name) {
    //     case 'crypto':
    //     case 'node:crypto':
    //       console.log('found crypto import');
    //       node.local.name = './proxymodules/cryptoProxy.js';
    //       break;
    //     default:
    //       break;
    //   }
    // },

    // ImportExpression(node) {
    //   console.log(`found ImportExpression ${node.source}`)
    // }
  })

  r.source = astring.generate(ast);
  console.log("patched r.source", r.source);

  return r;
}
