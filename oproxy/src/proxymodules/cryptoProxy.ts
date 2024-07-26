// import * as crypto from 'node:crypto';
const nodeCrypto = require('node:crypto');

// Weakset of cipher objects created
const createdCipherProxyObjs: WeakRef<CipherProxyObj>[] = [];
// Weakset of decipher objects created
const createdDecipherProxyObjs: WeakRef<DecipherProxyObj>[] = [];

interface CipherProxyObj {
  [finalCalledSymbol]?: boolean;
}
interface DecipherProxyObj {
  [finalCalledSymbol]?: boolean;
}

const finalCalledSymbol = Symbol('[[finalCalled]]');

// insecure algs
const INSECURE_SYMM_ENCRYPTION_FUNCS = ["RC2", "RC-2",
                                      "RC4", "RC-4",
                                      "RC5", "RC-5",
                                      "DES", "DESede",
                                      "Blowfish", "IDEA",
                                      "3-KeyTripleDES"]

const createCipherivHandler = {
  //modify createCipheriv to return a proxy object that wraps the cipher object and tracks if final is called
  apply: function (target: any, thisArg: any, argumentsList: any) {
    console.log(`createCipheriv called with args: ${argumentsList}`);

    // check if the algorithm is insecure
    const algorithm = argumentsList[0];
    if (INSECURE_SYMM_ENCRYPTION_FUNCS.includes(algorithm)) {
      console.log(`Insecure algorithm ${algorithm} used`);
      throw new Error(`Insecure algorithm ${algorithm} used`);
    }

    const cipherObj = target(...argumentsList);

    // add the cipher object to the weakset
    createdCipherProxyObjs.push(new WeakRef(cipherObj));

    //wrap the cipherObj in another Proxy that keeps track of if final is ever called
    const cipherObjHandler = {
      get: function (target: any, prop: any, receiver: any) {
        // if calling final, set the finalCalledSymbol to true
        switch(prop) {
          case "final":
            target[finalCalledSymbol] = true;
            break;
          // case: 

          default:
            break;
        }
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
  //modify createDecipheriv to return a proxy object that wraps the decipher object and tracks if final is called
  apply: function (target: any, thisArg: any, argumentsList: any) {
    console.log(`createDecipheriv called with args: ${argumentsList}`);

    const decipherObj = target(...argumentsList);

    // add the decipher object to the weakset
    createdDecipherProxyObjs.push(new WeakRef(decipherObj));

    //wrap the decipherObj in another Proxy that keeps track of if final is ever called
    const decipherObjHandler = {
      get: function (target: any, prop: any, receiver: any) {
        // if calling final, set the finalCalledSymbol to true
        // if (prop === 'final') {
        //   target[finalCalledSymbol] = true;
        // }
        switch(prop) {
          case "final":
            target[finalCalledSymbol] = true;
            break;
          default:
            break;
        }
        return Reflect.get(target, prop, receiver);
      },
    };

    //create a proxy object that wraps the decipher object
    const decipherProxy = new Proxy(decipherObj, decipherObjHandler);

    //return the decipher proxy
    return decipherProxy;
  },
};

// create a proxy for the createDecipheriv function
const createDecipherivProxy = new Proxy(
  nodeCrypto.createDecipheriv.bind(nodeCrypto),
  createDecipherivHandler
);

// crypto object with create decipher replaced with a proxy

process.on('exit', () => {
  for (const ref of createdDecipherProxyObjs) {
    let obj = ref.deref();
    if (obj !== undefined && typeof obj === 'object') {
      if (!obj![finalCalledSymbol]) {
        console.log('Final was never called');
        throw new Error('Final was never called');
      } else {
        console.log('Final was called yay :))))');
      }
    }
  }
});

const cryptoProxy = {
  ...nodeCrypto,
  createDecipheriv: createDecipherivProxy,
};

module.exports["default"] = cryptoProxy;
Object.keys(cryptoProxy).forEach(k => module.exports[k] = cryptoProxy[k]);
