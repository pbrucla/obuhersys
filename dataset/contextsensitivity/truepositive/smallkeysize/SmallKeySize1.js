const util = require("util");
const crypto = require("crypto");

// two different buffer sizes assigned to variables, object1(1024) and object2(2048), insecure object1 buffer size used for function

async function main() {
  try {
    const object1 = Identity({ modulusLength: 1024 });
    const object2 = Identity({ modulusLength: 2048 });
    const buffer = Buffer.from("whatever");
    const { publicKey, privateKey } = await util.promisify(
      crypto.generateKeyPair,
    )("rsa", object1);
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    const decrypt = crypto.privateDecrypt(privateKey, encrypted);

    console.log("public:", encrypted);
    console.log("decrypt:", new TextDecoder().decode(decrypt));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function Identity(i) {
  return i;
}

main();
