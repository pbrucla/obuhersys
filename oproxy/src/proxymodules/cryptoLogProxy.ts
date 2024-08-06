const fs = require('node:fs');
const _crypto = require('node:crypto?owouwu');
const path = require('node:path');
const { promisify } = require('util');

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

function wrap<T>(objToTrack: T, id: number, cname: string): T {
  const handler = {
    get: function (target: any, prop: any, receiver: any) {
      let result = Reflect.get(target, prop, receiver);
      //log function calls to output file
      if (typeof result === 'function') {
        const ret = (...args: any[]) => {
          logCall(id, target, prop, args);
          
          const res = result.apply(target, args);
          return res;
        };
        (ret as any)[promisify.custom] = promisify(result);
        return ret;
      }
      logCall(id, target, prop, receiver);
      return Reflect.get(target, prop, receiver);
    },
  };
  (objToTrack as any)["__damn_src"] = cname;
  return new Proxy(objToTrack, handler);
}

function wrapConstructor<A extends any[], R, F extends (...args: A) => R>(target : string, constructor : F, cname : string) {
  return (...args : Parameters<F>) => {
    const id = idCount++;
    logConstruct(cname, id, target, cname, args);
    return wrap(constructor(...args), id, cname);
  };
}


const createCipheriv = wrapConstructor('crypto', _crypto.createCipheriv, 'createCipheriv');
const creatDecipheriv = wrapConstructor('crypto', _crypto.createDecipheriv, 'createDecipheriv');
const randomBytes = wrapConstructor('crypto', _crypto.randomBytes, 'randomBytes');
const createHash = wrapConstructor('crypto', _crypto.createHash, 'createHash');
// const generateKeyPair = wrapConstructor('crypto', _crypto.generateKeyPair, 'generateKeyPair');
const pbkdf2 = wrapConstructor('crypto', _crypto.pbkdf2, 'pbkdf2');

const constructors: Record<string, any> = {
  'createCipheriv': createCipheriv,
  'createDecipheriv': creatDecipheriv,
  // 'randomBytes': randomBytes,
  'createHash': createHash,
  'pbkdf2': pbkdf2,
  // 'generateKeyPair': generateKeyPair,
};


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
      const ret = (...args: any[]) => {
        logCall(null, 'crypto', prop, args);
        
        const res = result.apply(target, args);
        return res;
      };
      (ret as any)[promisify.custom] = promisify(result);
      return ret;

    } else {
      return Reflect.get(target, prop, receiver);
    }
  },
});

module.exports['default'] = cryptoProxy;
Object.keys(cryptoProxy).forEach((k) => (module.exports[k] = cryptoProxy[k]));
