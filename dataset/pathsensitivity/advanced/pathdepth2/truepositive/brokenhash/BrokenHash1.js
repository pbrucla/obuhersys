const crypto = require("crypto");

// 'md5' insecure hash
async function main() {
  const data = "some data here";
  let hash;
  const condition = 2;

  if (condition > 1) {
    hash = crypto.createHash("md5");
  } else {
    if (condition > 0) {
      hash = crypto.createHash("sha256");
    } else {
      hash = crypto.createHash("sha1");
    }
  }

  hash.update(data);
  const digest = hash.digest("hex");

  console.log(digest);
}

main();
