const crypto = require("crypto");

// The algo members are set to a broken hash 'md5' and a secure hash 'sha256', but only the insecure algo is used to create the hash.
async function main() {
  const data = "some data here";
  const hashObject1 = HashClass.GetObject("md5");
  const hashObject2 = HashClass.GetObject("sha256");
  const hash = crypto.createHash(hashObject1.algorithm);
  hash.update(data);
  const digest = hash.digest("hex");

  console.log(digest);
}

class HashClass {
  constructor() {
    this.algorithm = "";
  }
  static GetObject(algo) {
    const object = new HashClass();
    object.algorithm = algo;
    return object;
  }
}

main();
