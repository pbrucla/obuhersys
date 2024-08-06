const crypto = require("crypto");

// 'md5' insecure hash
async function main() {
  const data = "some data here";
  let hash;
  const condition = 1;

  if (condition > 0) {
    if (condition < 0) {
      hash = crypto.createHash("sha1");
    } else {
      if (condition == 1) {
        hash = crypto.createHash("sha256");
      } else {
        hash = crypto.createHash("md4");
      }
    }
  } else {
    hash = crypto.createHash("md5");
  }

  hash.update(data);
  const digest = hash.digest("hex");

  console.log(digest);
}

main();
