const crypto = require("crypto");

// Five variables are set to names of secure and insecure algorithms. One variable containing an insecure algo is then used to initialize a hash.
async function main() {
  const data = "some data here";
  const algo1 = Identity("md5");
  const algo2 = Identity("sha256");
  const algo3 = Identity("md5");
  const algo4 = Identity("sha1");
  const algo5 = Identity("md2");
  const hash = crypto.createHash(algo4);
  hash.update(data);
  const digest = hash.digest("hex");

  console.log(digest);
}
function Identity(s) {
  return s;
}

main();
