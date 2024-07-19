const objectsToTrack = [
  'crypto.createCipheriv',
  'crypto.createDecipheriv'
]
//==============================================================================

// produces log file in current directory / wherever run start is called form
const logFile = './cryptoLog.txt';


//==============================================================================

const fs = require('fs');
const nodeCrypto = require("node:crypto");

// import fs from 'fs';
// import nodeCrypto from "node:crypto";

const createCipherivHandler = {
  apply: function (target: any, thisArg: any, createCipherArgumentsList: any) {
    // logCall('crypto', 'createCipheriv', argumentsList);

    const cipherObj = target(...createCipherArgumentsList);

    //wrap the cipherObj in another Proxy that keeps track of if final is ever called
    const cipherObjHandler = {
      get: function (target: any, prop: any, receiver: any) {
        let result =  Reflect.get(target, prop, receiver);
        //log function calls to output file
        if (typeof result === 'function') {
          return function (this: any, ...args: any[]) {
            logCall('createCipherivObj', prop, args);
            return result.apply(this, args);
          };
        }
        logCall('createCipherivObj', prop, receiver);
        return Reflect.get(target, prop, receiver);
      },
    };

    //create a proxy object that wraps the cipher object
    const cipherProxy = new Proxy(cipherObj, cipherObjHandler);

    //return the cipher proxy
    return cipherProxy;
  },
};

const createDecipherivHandler = {
  apply: function (target: any, thisArg: any, createDecipherArgumentsList: any) {
    // logCall('crypto', 'createDecipheriv', argumentsList);

    const decipherObj = target(...createDecipherArgumentsList);

    //wrap the decipherObj in another Proxy that keeps track of if final is ever called
    const decipherObjHandler = {
      get: function (target: any, prop: any, receiver: any) {
        let result =  Reflect.get(target, prop, receiver);
        //log function calls to output file
        if (typeof result === 'function') {
          return function (this: any, ...args: any[]) {
            logCall('createDecipherivObj', prop, args);
            return result.apply(this, args);
          };
        }
        logCall('createDecipherivObj', prop, receiver);
        return Reflect.get(target, prop, receiver);
      },
    };

    //create a proxy object that wraps the decipher object
    const decipherProxy = new Proxy(decipherObj, decipherObjHandler);

    //return the decipher proxy
    return decipherProxy;
  },
};

function logCall(target: any, prop: any, args: any) {

  // avoid logging node internals
  if (typeof prop === 'symbol') {
    return;
  }

  // avoid logging any toString related functions invoked by this logCall to avoid infinite loops
  if (prop === 'toString' || prop === 'toJSON' || prop === 'valueOf') {
    return;
  }

  // convert to strings
  const targetString = String(target);
  const propString = String(prop);
  let argsString = '';
  if (args && Array.isArray(args)) {
    argsString = JSON.stringify(args).slice(1, -1);
  }

  // log the call to a file
  console.log(`${targetString}.${propString}(${argsString})`);
  fs.appendFileSync(logFile, `${targetString}.${propString}(${argsString})\n`);
}

const cryptoProxy = new Proxy(nodeCrypto, {
  get: function (target: any, prop: any, receiver: any) {
    let result = Reflect.get(target, prop, receiver);
    if (prop === 'createCipheriv' && objectsToTrack.includes('crypto.createCipheriv')) {
      result = new Proxy(result, createCipherivHandler);
    } else if (prop === 'createDecipheriv' && objectsToTrack.includes('crypto.createDecipheriv')) {
      result = new Proxy(result, createDecipherivHandler);
    } 

    if (typeof result === 'function') {
      return function (this: any, ...args: any[]) {
        logCall('crypto', prop, args);
        return result.apply(this, args);
      };
    }
    else {
      return Reflect.get(target, prop, receiver);
    }
  },
});

module.exports["default"] = cryptoProxy;
Object.keys(cryptoProxy).forEach(k => module.exports[k] = cryptoProxy[k]);
