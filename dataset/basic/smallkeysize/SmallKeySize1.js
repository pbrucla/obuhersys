const util = require("util");
const crypto = require("crypto");

// 1024 buffer size is not secure
async function main() {
  try {
    const object = { modulusLength: 1024 };
    const buffer = Buffer.from("whatever");
    const { publicKey, privateKey } = await util.promisify(
      crypto.generateKeyPair,
    )("rsa", object);
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    const decrypt = crypto.privateDecrypt(privateKey, encrypted);

    console.log("public:", encrypted);
    console.log("decrypt:", new TextDecoder().decode(decrypt));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
