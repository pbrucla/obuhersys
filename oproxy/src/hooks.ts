import path from 'node:path';
import fs from 'node:fs';
import { SourceMapGenerator } from 'source-map';
import { fileURLToPath, pathToFileURL } from 'url';

const UNWRAP_NAMESPACE_PLS = '__damn_unwrap_namespace_pls';

export async function initialize(data: any) {
  // Receives data from `register`.
}

export async function resolve(specifier: any, context: any, nextResolve: any) {
  if (specifier === 'node:crypto?owouwu') {
    return nextResolve('node:crypto', { owo: 'uwu' });
  }
  if (context?.owo !== 'uwu' && ['crypto', 'node:crypto'].includes(specifier)) {
    return nextResolve(pathurlResolveProxy('cryptoLogProxy.js'));
  }
  return nextResolve(specifier);
};

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

  if (new URL(url).pathname.split('/').at(-2) === 'proxymodules') {
    // Don't modify if it's the proxy module importing the original module, avoid circular import
    // console.log(`loading proxy ${url}\n`);
    r.format = 'commonjs';
  }
  return r;
}


function pathurlResolveProxy(module: string): string {
  return pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), 'proxymodules', module)).toString();
}

function resolveProxy(module: string): string {
  const fileurl = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), 'proxymodules', module)).toString();
  return fileurl.slice(7);
}
