"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = require("node:crypto");
// some random data
var data = [crypto.randomBytes(256)];
var key = "potato".repeat(Math.ceil(32 / 6)).substring(0, 32);
var iv = "beetroot";
var finalCalled = true;
var cipherHandler = {
    apply: function (target, thisArg, argumentsList) {
        console.log("createCipheriv called with args: ".concat(argumentsList));
        var cipherObj = target.apply(void 0, argumentsList);
        //wrap the cipherObj in another Proxy that keeps track of if final is ever called
        var cipherObjHandler = {
            finalCalled: false,
            get: function (target, prop, receiver) {
                if (prop === "final") {
                    console.log("final called");
                    this.finalCalled = true;
                }
                return Reflect.get(target, prop, receiver);
            },
            //when object is destroyed, check if final was called
            //if not, throw an error
            finalize: function () {
                if (!this.finalCalled) {
                    throw new Error("final was not called on the cipher object");
                    console.log("final was not called on the cipher object");
                }
                else {
                    console.log("final was called on the cipher object");
                }
            }
        };
        var cipherProxy = new Proxy(cipherObj, cipherObjHandler);
        //return the cipher proxy
        return cipherProxy;
    },
};
// const cipherFinalHandler = {
//    apply: function(target: any, thisArg: any, argumentsList : any) {
//       console.log(`cipher.final() called with args: ${argumentsList}`)
//    }
// }
var createCipherivProxy = new Proxy(crypto.createCipheriv, cipherHandler);
var cipher = createCipherivProxy("aes-256-gcm", key, iv);
// const cipherFinalProxy = new Proxy(cipher.final, cipherFinalHandler)
var chunks = [];
for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
    var chunk = data_1[_i];
    chunks.push(cipher.update(chunk));
}
chunks.push(cipher.final()); // crucial line
var decrypted = Buffer.concat(chunks);
