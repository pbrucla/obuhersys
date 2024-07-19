const { createCipheriv: createEnc, randomBytes } = require('crypto');

const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  const algo = 'aes-256-gcm';
  const data = 'some data here';
  const iv = Buffer.from('owo uwu a static iv just for you');
  fn1(algo, data, iv, createEnc);
}

function fn1(algo, data, iv, makeEnc) {
  const algorithm = algo;
  const dataString = data;
  fn2(algorithm, dataString, iv, makeEnc);
}

function fn2(algorithm, dataString, iv, makeEnc) {
  const enc = makeEnc(algorithm, randomBytes(32), (iv = randomBytes(16)));
  console.log(Buffer.concat([enc.update(dataString), enc.final()]).toString('hex'));
}

main();
