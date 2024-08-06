const crypto = require("crypto");

// Two diffreent byte arrays, one static (salt1) and one random (salt2) are initialized. The random salt (salt1) is then used for the pbkdf2 function.
const salt1 = Identity(Buffer.from([123]));
const salt2 = Identity(crypto.randomBytes(16));
const iterations = 1000000;
const password = "your-password";
const keyLength = 32;
const digest = "sha256";

crypto.pbkdf2(
  password,
  salt1,
  iterations,
  keyLength,
  digest,
  (err, derivedKey) => {
    if (err) throw err;
    console.log("Derived key:", derivedKey.toString("hex"));
  },
);

function Identity(s) {
  return s;
}
main();
