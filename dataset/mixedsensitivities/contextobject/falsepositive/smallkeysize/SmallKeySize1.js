const util = require("util");
const crypto = require("crypto");

// Initialized two key sizes, one insecure (1024 too small) and one secure (3072) and proceeded to use the secure keylength to generate the key.
async function main() {
  try {
    const sizeObject1 = SizeClass.GetObject({ modulusLength: 1024 });
    const sizeObject2 = SizeClass.GetObject({ modulusLength: 3072 });
    const buffer = Buffer.from("whatever");
    const { publicKey, privateKey } = await util.promisify(
      crypto.generateKeyPair,
    )("rsa", { modulusLength: sizeObject2.keySize });
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    const decrypt = crypto.privateDecrypt(privateKey, encrypted);

    console.log("public:", encrypted);
    console.log("decrypt:", new TextDecoder().decode(decrypt));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

class SizeClass {
  constructor(keySize) {
    this.keySize = keySize;
  }

  static GetObject({ modulusLength }) {
    return new SizeClass(modulusLength);
  }
}

main();
