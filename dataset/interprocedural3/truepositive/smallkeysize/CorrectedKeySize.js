const { generateKeyPair, publicEncrypt, privateDecrypt} = require('crypto');
const { promisify } = require('util');

async function main() {
  const size = 2048;
  const data = Buffer.from('heyyy');
  await fn1(data, size, generateKeyPair);
}

async function fn1(data, size, makePair) {
  const keysize = size;
  const dataString = data;
  await fn2(keysize, dataString, makePair);
}

async function fn2(modulusLength, buffer, makePair) {
  const { publicKey, privateKey } = await promisify(generateKeyPair)("rsa", { modulusLength });
  const encrypted = publicEncrypt(publicKey, buffer);
  const decrypt = privateDecrypt(privateKey, encrypted);
  console.log(decrypt.toString());
}

main();
