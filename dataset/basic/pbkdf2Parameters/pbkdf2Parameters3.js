const crypto = require("crypto");

// 'sha-1' insecure hashing algorithm
const salt = crypto.randomBytes(16);
const iterations = 1000000;
const password = "your-password";
const keyLength = 32;
const digest = "sha1";

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
