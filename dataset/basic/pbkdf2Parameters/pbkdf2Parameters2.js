const crypto = require("crypto");

// too small numbers of iterations should be at least 10,0000
const salt = crypto.randomBytes(16);
const iterations = 1000;
const password = "your-password";
const keyLength = 32;
const digest = "sha256";

crypto.pbkdf2(
  password,
  salt,
  iterations,
  keyLength,
  digest,
  (err, derivedKey) => {
    if (err) throw err;
    console.log("Derived key:", derivedKey.toString("hex"));
  },
);
