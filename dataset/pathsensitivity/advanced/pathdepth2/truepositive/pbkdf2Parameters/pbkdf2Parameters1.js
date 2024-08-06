const crypto = require("crypto");

const iterations = 10000000;
const password = "your-password";
const keyLength = 32;
const digest = "sha256";
const condition = 0;
let salt;

if (condition > 1) {
  salt = crypto.randomBytes(16);
} else {
  if (condition < 0) {
    salt = crypto.randomBytes(16);
  } // static salt is insecure
  else salt = Buffer.from([123]);
}

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
