const crypto = require("crypto");

// Two initialization vectors are intiialized, one statially insecure (iv1) and one randomly secure (iv2). The static, insecure iv is then used to create the cipher.
async function main() {
  try {
    const algorithm = "aes-256-gcm";
    const key = crypto.randomBytes(32); // Generate a random key with 256 bits
    const ivObject1 = IvClass.GetObject(Buffer.from("abcdefghijkl", "utf8"));
    const ivObject2 = IvClass.GetObject(crypto.randomBytes(12));

    const cipher = crypto.createCipheriv(algorithm, key, ivObject1.ivBytes);
    const encrypted = cipher.update("some plaintext data", "utf8", "hex") +
      cipher.final("hex");

    const tag = cipher.getAuthTag(); // Get the authentication tag

    console.log("Encrypted:", encrypted);
    console.log("Authentication tag:", tag.toString("hex"));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

class IvClass {
  constructor(bytes) {
    this.ivBytes = bytes;
  }

  static GetObject(bytes) {
    return new IvClass(bytes);
  }
}

main();
