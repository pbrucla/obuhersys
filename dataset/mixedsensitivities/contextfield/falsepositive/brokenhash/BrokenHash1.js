const crypto = require("crypto");

// Names of a secure and an insecure hash algorithm (md5) are stored in an object's field by using the Identity function. The secure one is then used to finalize the hash.
async function main() {
  const data = "some data here";
  const hashclass = new HashClass();
  hashclass.hash1 = Identity("md5");
  hashclass.hash2 = Identity("sha256");
  const hash = crypto.createHash(hashclass.hash2);
  hash.update(data);
  const digest = hash.digest("hex");

  console.log(digest);
}

function Identity(s) {
  return s;
}

class HashClass {
  constructor() {
    this.hash1 = "";
    this.hash2 = "";
  }
}

main();
