const checks = [
  {
    name: 'call .final()',
    trigger: {
      type: 'constructor',
      lib: 'crypto',
      fn: 'createDecipheriv',
      args: ['aes-256-gcm']
    },
    implies: [
      { type: 'call', method: 'final' }
    ]
  },
  {
    name: 'no insecure random',
    trigger: {
      type: 'constructor',
      lib: 'crypto',
      fn: 'createEncipheriv',
      args: [{ type: 'wildcard' }, { type: 'random' }, { type: 'random' }]
    }
  }
];

const objectsToTrack = [
  'crypto.createEncipheriv',
  'crypto.createDecipheriv'
]
//==============================================================================

const logFile = 'cryptoLog.txt';

//==============================================================================

const fs = require('fs');
const nodeCrypto = require("node:crypto");

const createCipherivHandler = {
  apply: function (target: any, thisArg: any, argumentsList: any) {
    logCall('crypto', 'createCipheriv', argumentsList);
    fs.appendFileSync(logFile, `createCipheriv(${argumentsList})\n`);

    const cipherObj = target(...argumentsList);

    //wrap the cipherObj in another Proxy that keeps track of if final is ever called
    const cipherObjHandler = {
      get: function (target: any, prop: any, receiver: any) {
        //log function calls to output file
        logCall('cipherObj', prop, argumentsList);
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
  apply: function (target: any, thisArg: any, argumentsList: any) {
    logCall('crypto', 'createDecipheriv', argumentsList);
    fs.appendFileSync(logFile, `createDecipheriv(${argumentsList})\n`);

    const decipherObj = target(...argumentsList);

    //wrap the decipherObj in another Proxy that keeps track of if final is ever called
    const decipherObjHandler = {
      get: function (target: any, prop: any, receiver: any) {
        //log function calls to output file
        logCall('decipherObj', prop, argumentsList);
        return Reflect.get(target, prop, receiver);
      },
    };

    //create a proxy object that wraps the decipher object
    const decipherProxy = new Proxy(decipherObj, decipherObjHandler);

    //return the decipher proxy
    return decipherProxy;
  },
};

function logCall(obj: any, prop: any, args: any) {
  console.log(`${obj}.${prop}(${args})`);
  fs.appendFileSync(logFile, `${obj}.${prop}(${args})\n`);
}

// const cryptoProxy = new Proxy(nodeCrypto, {
//   get: function (target: any, prop: any, receiver: any) {
//     if (prop === 'createCipheriv') {
//       return new Proxy(target[prop], createCipherivHandler);
//     } else if (prop === 'createDecipheriv') {
//       return new Proxy(target[prop], createDecipherivHandler);
//     } else {
//       return Reflect.get(target, prop, receiver);
//     }
//   },
// });


const cryptoProxy = {
  ...nodeCrypto,
  createCipheriv: new Proxy(nodeCrypto.createCipheriv, createCipherivHandler),
  createDecipheriv: new Proxy(nodeCrypto.createDecipheriv, createDecipherivHandler)
}
cryptoProxy.default = cryptoProxy;


const individualExports = { ...cryptoProxy };

// Export individual properties
Object.keys(individualExports).forEach(key => {
  module.exports[key] = individualExports[key];
});

// module.exports.default = cryptoProxy;