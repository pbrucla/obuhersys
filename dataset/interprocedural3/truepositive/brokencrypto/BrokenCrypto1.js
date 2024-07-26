const { createCipheriv: createEnc, randomBytes } = require('crypto');

async function main() {
  const algo = 'des';
  const data = 'some data here';
  fn1(algo, data, createEnc);
}

function fn1(algo, data, makeEnc) {
  const algorithm = algo;
  const dataString = data;
  fn2(algorithm, dataString, makeEnc);
}

function fn2(algorithm, dataString, makeEnc) {
  const enc = makeEnc(algorithm, randomBytes(8), randomBytes(8));
  console.log(Buffer.concat([enc.update(dataString), enc.final()]).toString('hex'));
}

main();
