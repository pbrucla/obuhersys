const { createCipheriv: createEnc, randomBytes } = require("crypto");

const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  const algo = "aes-256-gcm";
  const data = "some data here";
  const key = randomBytes(32);
  fn1(algo, data, key, createEnc);
}

function fn1(algo, data, key, makeEnc) {
  const algorithm = algo;
  const dataString = data;
  fn2(algorithm, dataString, key, makeEnc);
}

function fn2(algorithm, dataString, key, makeEnc) {
  const enc = makeEnc(algorithm, key, randomBytes(16));
  console.log(
    Buffer.concat([enc.update(dataString), enc.final()]).toString("hex"),
  );
}

main();
