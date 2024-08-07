# Obuhersys: Dynamic Analysis of Cryptographic API Misuse in NodeJS

_to be published in [MIT URTC 2024](https://urtc.mit.edu/)_

Obuhersys is a proof-of-concept framework for logging and checking a wide array of cryptographic API misuses in NodeJS code.

It features two methods to dynamically log API misuses at runtime with low overhead:
- [ofunc](ofunc/), which inject logging calls by doing AST transformations on the source code, and
- [oproxy](oproxy/), which inject logging calls by wrapping the Node Standard Library using JavaScript's Proxy class

The output of either logger can then be run through our [checker](oproxy/src/log/index.ts) and [ruleset](oproxy/src/tests/checks.js) to report any API misuses!
