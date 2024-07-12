import fs, { access } from 'node:fs';
import cryptoProxy from './proxymodules/cryptoProxy.js';


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
  console.log(url, context, r);
  if (r.source) {
  r.source = `
  console.log('hi', require);
  ` + r.source.toString();
  }
  // if (context.format === "module" && r.source) {
  //   r.source = compile(config.wrapperName, r.source.toString());
  // }
  return r;
};

export const globalPreload: GlobalPreloadHook = function () {
  // const jsonConfig = JSON.stringify(config);
  // const root = JSON.stringify(__dirname);
  // return `globalThis.${config.wrapperName} = (${agent})(${root}, ${jsonConfig});`;
  // return '';

  // globalThis.require = ((actualRequire) => {
  //   return (module) => {
  //     switch(module) {
  //       case 'crypto':
  //         return cryptoProxy;
  //       default:
  //         return actualRequire(module);
  //     }
  //   }
  // })(require);

  // return '';
  // return 'console.log(Object.keys(globalThis))'


  return `

  console.log("HI");
  console.trace();
  
  const require = (await import("node:module")).createRequire(".");
  
  globalThis.require = ((actualRequire) => {
    return (module) => {
      switch(module) {
        case 'crypto':
          return cryptoProxy;
        default:
          return actualRequire(module);
      }
    }
  })(require);
  `;
};

// const { createCipheriv } = require('crypto');


/// require() -> obj = { createCipher* }, obj.createCipheriv
// require() -> obj -> { createCipheriv } (proxy function named with original function name?), obj.createCipheriv (calls our function which is a proxy of orig function and returns a proxy object of cipher which keeps track of final) 

/***
 * 
 * Going forward, as a for now solution, can overwrite require in each src file by prepending it to the beginning of each file? Or we could use a transformer to directly replace require calls and make it call our require function instead of the actual require function.
 * 
 */