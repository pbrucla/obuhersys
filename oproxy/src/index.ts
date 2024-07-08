import * as crypto from 'node:crypto';
import { Cipher } from 'node:crypto';
// import { FinalizationRegistry } from "node:util"

// some random data
const data: Buffer[] = [crypto.randomBytes(256)];

const key = 'potato'.repeat(Math.ceil(32 / 6)).substring(0, 32);
const iv = 'beetroot';

interface CipherObj {
  [finalCalledSymbol]?: boolean;
}

// Weakset of cipher objects created
const createdCipherObjs: WeakRef<CipherObj>[] = [];
const finalCalledSymbol = Symbol('[[finalCalled]]');

const cipherHandler = {
  //modify createCipheriv to return a proxy object that wraps the cipher object and tracks if final is called
  apply: function (target: any, thisArg: any, argumentsList: any) {
    console.log(`createCipheriv called with args: ${argumentsList}`);

    const cipherObj = target(...argumentsList);

    // add the cipher object to the weakset
    createdCipherObjs.push(new WeakRef(cipherObj));

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
const createCipherivProxy = new Proxy(crypto.createCipheriv, cipherHandler);

// create a cipher object that is actually our cipher proxy object
const cipher: Cipher = createCipherivProxy('aes-256-gcm', key, iv);

// const registry = new FinalizationRegistry((heldValue) => {
//   console.log(`Cleanup for object ${heldValue}`);
// });

// registry.register(cipher, 'cipher');

const chunks: Buffer[] = [];
for (const chunk of data) {
  chunks.push(cipher.update(chunk));
}

const PULLTHELEVERKRONK = false;
if (PULLTHELEVERKRONK) {
  chunks.push(cipher.final()); // crucial line
}

const decrypted: Buffer = Buffer.concat(chunks);

// when program ends check if final was called on the cipher objects
process.on('exit', () => {
  for (const ref of createdCipherObjs) {
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

// oh yeah pro tip from anderw
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry
// ^ this lets you figure out when an object stops existing
// so in this case if the cipher objects disappears and final hasn't been called you can probably sound the alarm
// andrew awayyyyyy
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry#notes_on_cleanup_callbacks
// this is concerning though
// halp, the concerns are real, clean ups

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap

// register the cipherProxy with the finalization registry
// const registry = new FinalizationRegistry((heldValue) => {
//    console.log(`Cleanup for object ${heldValue}`);

//    console.log(`Final called: ${cipherObjHandler.finalCalled}`);
//    if (!cipherObjHandler.finalCalled) {
//       console.log("Final was never called");
//       throw new Error("Final was never called");
//    }
//    else {
//       console.log("Final was called yay :))))");
//    }
//  });

// registry.register(cipherProxy, 'cipherProxy');
