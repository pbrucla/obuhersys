import * as crypto from 'node:crypto';

// Weakset of cipher objects created
const createdCipherProxyObjs: WeakRef<CipherProxyObj>[] = [];

interface CipherProxyObj {
  [finalCalledSymbol]?: boolean;
}
const finalCalledSymbol = Symbol('[[finalCalled]]');

const createCipherivHandler = {
  //modify createCipheriv to return a proxy object that wraps the cipher object and tracks if final is called
  apply: function (target: any, thisArg: any, argumentsList: any) {
    console.log(`createCipheriv called with args: ${argumentsList}`);

    const cipherObj = target(...argumentsList);

    // add the cipher object to the weakset
    createdCipherProxyObjs.push(new WeakRef(cipherObj));

    //wrap the cipherObj in another Proxy that keeps track of if final is ever called
    const cipherObjHandler = {
      get: function (target: any, prop: any, receiver: any) {
        // if calling final, set the finalCalledSymbol to true
        if (prop === 'final') {
          target[finalCalledSymbol] = true;
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

// create a proxy for the createCipheriv function
const createCipherivProxy = new Proxy(
  crypto.createCipheriv.bind(crypto),
  createCipherivHandler
);

// crypto object with create cipher replaced with a proxy

process.on('exit', () => {
  for (const ref of createdCipherProxyObjs) {
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
  ...crypto,
  createCipheriv: createCipherivProxy,
};

console.log(cryptoProxy)

export default cryptoProxy;
