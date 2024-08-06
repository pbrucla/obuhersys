const crypto = require("crypto");

// Names of a secure and an insecure mode (ecb) are stored in an object's field by using the Identity function. The secure one is then used to finalize the cipher.
async function main() {
  try {
    const ecbclass = new EcbClass();
    ecbclass.ecb1 = Identity("aes-256-ecb");
    ecbclass.ecb2 = Identity("aes-256-gcm");
    const key = crypto.randomBytes(32); // Generate a random key with 256 bits
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(ecbclass.ecb2, key, iv);
    const encrypted = cipher.update("some plaintext data", "utf8", "hex") +
      cipher.final("hex");

    const tag = cipher.getAuthTag(); // Get the authentication tag

    console.log("Encrypted:", encrypted);
    console.log("Authentication tag:", tag.toString("hex"));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function Identity(s) {
  return s;
}

class EcbClass {
  constructor() {
    this.ecb1 = "";
    this.ecb2 = "";
  }
}

main();
