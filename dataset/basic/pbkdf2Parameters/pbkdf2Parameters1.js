const crypto = require("crypto");

// static salt is insecure
const salt = Buffer.from([123]);
const iterations = 10000000;
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
