"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto = require("node:crypto");
// import { FinalizationRegistry } from "node:util"
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
        };
        var cipherProxy = new Proxy(cipherObj, cipherObjHandler);
        //register the cipherProxy with the finalization registry
        var registry = new FinalizationRegistry(function (heldValue) {
            console.log("Cleanup for object ".concat(heldValue));
            console.log("Final called: ".concat(cipherObjHandler.finalCalled));
            if (!cipherObjHandler.finalCalled) {
                console.log("Final was never called");
                throw new Error("Final was never called");
            }
            else {
                console.log("Final was called yay :))))");
            }
        });
        registry.register(cipherProxy, 'cipherProxy');
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
var PULLTHELEVERKRONK = false;
if (PULLTHELEVERKRONK) {
    chunks.push(cipher.final()); // crucial line
}
var decrypted = Buffer.concat(chunks);
// oh yeah pro tip from anderw
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry
// ^ this lets you figure out when an object stops existing
// so in this case if the cipher objects disappears and final hasn't been called you can probably sound the alarm
// andrew awayyyyyy
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry#notes_on_cleanup_callbacks
// this is concerning though
