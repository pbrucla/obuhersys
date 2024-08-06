const { createHash } = require("crypto");

async function main() {
  const algo = "md5";
  const data = "some data here";
  fn1(algo, data, createHash);
}

function fn1(algo, data, makeHash) {
  const algorithm = algo;
  const dataString = data;
  fn2(algorithm, dataString, makeHash);
}

function fn2(algorithm, dataString, makeHash) {
  const hash = makeHash("sha256");
  hash.update(dataString);
  console.log(hash.digest("hex"));
}

main();
