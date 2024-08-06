const util = require("util");
const crypto = require("crypto");

// Five different keysize variables are stored in variables. One variable with a sufficient keysize is then used to generate a KeyPair.
async function main() {
  try {
    const object1 = Identity({ modulusLength: 1024 });
    const object2 = Identity({ modulusLength: 3072 });
    const object3 = Identity({ modulusLength: 128 });
    const object4 = Identity({ modulusLength: 256 });
    const object5 = Identity({ modulusLength: 512 });
    const buffer = Buffer.from("whatever");
    const { publicKey, privateKey } = await util.promisify(
      crypto.generateKeyPair,
    )("rsa", object2);
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    const decrypt = crypto.privateDecrypt(privateKey, encrypted);

    console.log("public:", encrypted);
    console.log("decrypt:", new TextDecoder().decode(decrypt));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function Identity(s) {
  return s;
}

main();
