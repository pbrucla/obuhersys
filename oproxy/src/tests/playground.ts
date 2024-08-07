import * as crypto from "node:crypto";
import { Cipher } from "node:crypto";
// import { FinalizationRegistry } from "node:util";

// some random data
const data: Buffer[] = [crypto.randomBytes(256)];

const key = "potato".repeat(Math.ceil(32 / 6)).substring(0, 32);
const iv = "beetroot";

interface CipherObj {
  [finalCalledSymbol]?: boolean;
}

// Weakset of cipher objects created
const createdCipherObjs: WeakRef<CipherObj>[] = [];
const finalCalledSymbol = Symbol("[[finalCalled]]");

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
        if (prop === "final") {
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
const createCipherivProxy = new Proxy(crypto.createCipheriv.bind(crypto), cipherHandler);

// create a cipher object that is actually our cipher proxy object
const cipher: Cipher = createCipherivProxy("aes-256-gcm", key, iv);

// const registry = new FinalizationRegistry((heldValue) => {
//   console.log(`Cleanup for object ${heldValue}`);
// });

// registry.register(cipher, 'cipher');

const chunks: Buffer[] = [];
for (const chunk of data) {
  chunks.push(cipher.update(chunk));
}

const pullTheLever = true;
if (pullTheLever) {
  chunks.push(cipher.final()); // crucial line
}

const decrypted: Buffer = Buffer.concat(chunks);

// when program ends check if final was called on the cipher objects
process.on("exit", () => {
  for (const ref of createdCipherObjs) {
    let obj = ref.deref();
    if (obj !== undefined && typeof obj === "object") {
      if (!obj![finalCalledSymbol]) {
        console.log("Final was never called");
        throw new Error("Final was never called");
      } else {
        console.log("Final was called yay :))))");
      }
    }
  }
});
