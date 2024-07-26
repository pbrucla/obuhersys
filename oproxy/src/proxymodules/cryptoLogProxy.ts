const fs = require('node:fs');
const _crypto = require('node:crypto');
const path = require('node:path');

//==============================================================================

// produces log file in current directory / wherever run start is called form
const logFile = `./logs/cryptoLog-${new Date().getTime()}.log`;
const logFileResolved = path.resolve(logFile);

console.error(`==== DAMN ${'='.repeat(logFileResolved.length + 1)}
Logging to ${logFileResolved}
${'='.repeat(logFileResolved.length + 11)}
`);

//==============================================================================

let idCount = 0;

function wrap<T>(objToTrack: T, id: number): T {
  const handler = {
    get: function (target: any, prop: any, receiver: any) {
      let result = Reflect.get(target, prop, receiver);
      //log function calls to output file
      if (typeof result === 'function') {
        return function (this: any, ...args: any[]) {
          logCall(id, target, prop, args);
          return result.apply(this, args);
        };
      }
      logCall(id, target, prop, receiver);
      return Reflect.get(target, prop, receiver);
    },
  };
  return new Proxy(objToTrack, handler);
}

function wrapConstructor<A extends any[], R, F extends (...args: A) => R>(target : string, constructor : F, cname : string) {
  return (...args : Parameters<F>) => {
    const id = idCount++;
    logConstruct(cname, id, target, cname, args);
    return wrap(constructor(...args), id);
  };
}


const createCipheriv = wrapConstructor('crypto', _crypto.createCipheriv, 'createCipheriv');
const creatDecipheriv = wrapConstructor('crypto', _crypto.createDecipheriv, 'createDecipheriv');

const constructors: Record<string, any> = {
  'createCipheriv': createCipheriv,
  'createDecipheriv': creatDecipheriv,
};

//
function log(text: string) {
  console.log(text);
  fs.appendFileSync(logFile, text+"\n");
}

function logCall(id: number | null, target: any, prop: any, args: any) {
  // avoid logging node internals
  if (typeof prop === 'symbol') {
    return;
  }

  // avoid logging any toString related functions invoked by this logCall to avoid infinite loops
  if (prop === 'toString' || prop === 'toJSON' || prop === 'valueOf') {
    return;
  }

  const callObj = { type: "function", id, target, fn: prop, args };

  log(`${JSON.stringify(callObj)}`);
}

// Logs the construction of an object of name created with a function call made with given parameters
function logConstruct(objName: string, id: number, target: any, prop: any, args: any) {
  // const callString = callToString(target, prop, args);
  // log(`${objName}=${callString}`);

  const constructObj = { type: "constructor", objName, id, target, fn: prop, args };
  log(`${JSON.stringify(constructObj)}`);
}

const cryptoProxy = new Proxy(_crypto, {
  get: function (target: any, prop: any, receiver: any) {
    let result = Reflect.get(target, prop, receiver);
    let handler = constructors[`${prop}`];
    if (handler !== null && handler !== undefined) {
      return handler;
    } else if (typeof result === 'function') {
      return function (this: any, ...args: any[]) {
        logCall(null, 'crypto', prop, args);
        return result.apply(this, args);
      };
    } else {
      return Reflect.get(target, prop, receiver);
    }
  },
});

module.exports['default'] = cryptoProxy;
Object.keys(cryptoProxy).forEach((k) => (module.exports[k] = cryptoProxy[k]));
