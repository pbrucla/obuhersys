//==============================================================================

// produces log file in current directory / wherever run start is called form
const logFile = `./cryptoLog-${new Date().getTime()}.txt`;

//==============================================================================

const fs = require('fs');
const _crypto = require('node:crypto');

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
    logConstruct(cname, target, cname, args);
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

// function callToString(target: any, prop: any, args: any) {
//   // convert to strings
//   const targetString = String(target);
//   const propString = String(prop);
//   let argsString = '';
//   if (args && Array.isArray(args)) {
//     argsString = JSON.stringify(args).slice(1,-1);
//   }

//   const callString = `${targetString}.${propString}(${argsString})`;

//   return callString;
// }

function logCall(id: number | null, target: any, prop: any, args: any) {
  // avoid logging node internals
  if (typeof prop === 'symbol') {
    return;
  }

  // avoid logging any toString related functions invoked by this logCall to avoid infinite loops
  if (prop === 'toString' || prop === 'toJSON' || prop === 'valueOf') {
    return;
  }

  const callObj = { id, target, prop, args };

  log(`Function Call ${JSON.stringify(callObj)}`);
}

// Logs the construction of an object of name created with a function call made with given parameters
function logConstruct(objName: string, target: any, prop: any, args: any) {
  // const callString = callToString(target, prop, args);
  // log(`${objName}=${callString}`);

  const constructObj = { objName, target, prop, args };
  log(`Constructor Call ${JSON.stringify(constructObj)}`);
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
