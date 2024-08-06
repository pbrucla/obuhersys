const crypto = require("crypto");

// pbkdf2 function called securely with random salt, large iteration count (>= 10000), and strong hashing algorithm
const salt = crypto.randomBytes(16);
const iterations = 1000000;
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
