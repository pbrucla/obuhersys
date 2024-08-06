const { createCipheriv: createEnc, createDecipheriv, randomBytes } = require(
  "crypto",
);

const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  const algo = "aes-256-gcm";
  const data = Buffer.from("some data here");
  const key = randomBytes(32);
  const iv = randomBytes(16);
  const cipher = createEnc(algo, key, iv);
  const enc = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  fn1(algo, key, iv, enc, tag);
}

function fn1(algo, key, iv, enc, tag) {
  const decipher = createDecipheriv(algo, key, iv);
  decipher.setAuthTag(tag);
  const plain = decode(decipher, enc);
  console.log(plain.toString());
  decipher.final();
}

function decode(decipher, enc) {
  return decipher.update(enc);
}

main();
